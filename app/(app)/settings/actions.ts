'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';
import { eq, and, or, isNull, ilike, desc, inArray } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import {
  signOut as authSignOut,
  getCurrentUserId,
  agentEmailFor,
} from '@/lib/auth';
import { db } from '@/lib/db';
import {
  profiles,
  users,
  products,
  categories,
  shoppingItems,
  apiKeys,
} from '@/lib/db/schema';
import { isCategoryVisibleToFamily } from '@/lib/db/scope';
import { generateApiKeyString, hashApiKey } from '@/lib/api/auth';
import {
  escapeHtml,
  getAppBaseUrl,
  isEmailConfigured,
  sendEmail,
} from '@/lib/email';
import { sendPasswordChangedEmail } from '@/lib/email/password-changed';

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------
export async function signOut() {
  await authSignOut({ redirectTo: '/login' });
}

// ---------------------------------------------------------------------------
// Update display name
// ---------------------------------------------------------------------------
export type UpdateProfileState = {
  error: string | null;
  success: boolean;
};

export async function updateDisplayName(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const displayName = (formData.get('displayName') as string)?.trim();

  if (!displayName) {
    return { error: 'Podaj swoje imię.', success: false };
  }
  if (displayName.length < 2) {
    return { error: 'Imię musi mieć minimum 2 znaki.', success: false };
  }
  if (displayName.length > 30) {
    return { error: 'Imię może mieć maksymalnie 30 znaków.', success: false };
  }

  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  await db.update(profiles).set({ displayName }).where(eq(profiles.id, userId));

  revalidatePath('/', 'layout');
  return { error: null, success: true };
}

// ---------------------------------------------------------------------------
// Change password
// ---------------------------------------------------------------------------
export type ChangePasswordState = {
  error: string | null;
  success: boolean;
};

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const currentPassword = (formData.get('currentPassword') as string) ?? '';
  const newPassword = (formData.get('newPassword') as string) ?? '';
  const confirmPassword = (formData.get('confirmPassword') as string) ?? '';

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'Wypełnij wszystkie pola.', success: false };
  }
  if (newPassword.length < 6) {
    return {
      error: 'Nowe hasło musi mieć minimum 6 znaków.',
      success: false,
    };
  }
  if (newPassword !== confirmPassword) {
    return { error: 'Hasła nie są identyczne.', success: false };
  }

  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const [user] = await db
    .select({ email: users.email, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) redirect('/login');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return { error: 'Obecne hasło jest nieprawidłowe.', success: false };
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash: newHash })
    .where(eq(users.id, userId));

  // Security notification — best effort, never blocks the change.
  await sendPasswordChangedEmail(user.email);

  return { error: null, success: true };
}

// ---------------------------------------------------------------------------
// Send invite email
// ---------------------------------------------------------------------------
export type InviteEmailState = {
  error: string | null;
  success: boolean;
};

export async function sendInviteEmail(
  _prevState: InviteEmailState,
  formData: FormData,
): Promise<InviteEmailState> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();

  if (!email) {
    return { error: 'Podaj adres email.', success: false };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: 'Podaj prawidłowy adres email.', success: false };
  }

  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const [profile] = await db
    .select({ familyId: profiles.familyId, displayName: profiles.displayName })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile?.familyId) {
    return { error: 'Nie należysz do żadnej rodziny.', success: false };
  }

  const { families } = await import('@/lib/db/schema');
  const [family] = await db
    .select({ name: families.name, inviteCode: families.inviteCode })
    .from(families)
    .where(eq(families.id, profile.familyId))
    .limit(1);

  if (!family) {
    return { error: 'Nie znaleziono rodziny.', success: false };
  }

  if (!isEmailConfigured()) {
    return {
      error:
        'Wysyłanie emaili nie jest skonfigurowane. Użyj linku zaproszenia.',
      success: false,
    };
  }

  const baseUrl = getAppBaseUrl();
  const inviteLink = `${baseUrl}/join/${family.inviteCode}`;

  try {
    // Escape all user-controlled values before interpolating into HTML —
    // displayName and family name are user-set and would otherwise allow
    // HTML/markup injection into the outbound email.
    const safeDisplayName = escapeHtml(profile.displayName);
    const safeFamilyName = escapeHtml(family.name);

    await sendEmail({
      to: email,
      subject: `${profile.displayName} zaprasza Cię do rodziny "${family.name}" w Cartlo`,
      text:
        `${profile.displayName} zaprasza Cię do wspólnej listy zakupów w Cartlo.\n\n` +
        `Dołącz do rodziny "${family.name}":\n${inviteLink}\n`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
          <h2 style="color: #1a1a1a; margin-bottom: 8px;">Dołącz do rodziny "${safeFamilyName}"</h2>
          <p style="color: #6b6b6b; font-size: 15px; line-height: 1.6;">
            ${safeDisplayName} zaprasza Cię do wspólnej listy zakupów w <strong>Cartlo</strong>.
          </p>
          <a href="${inviteLink}"
             style="display: inline-block; margin-top: 16px; padding: 12px 24px;
                    background: #4ade80; color: #fff; font-weight: 600;
                    text-decoration: none; border-radius: 12px; font-size: 15px;">
            Dołącz do rodziny
          </a>
          <p style="margin-top: 24px; color: #9b9b9b; font-size: 13px;">
            Lub skopiuj link: <br/>
            <a href="${inviteLink}" style="color: #4ade80;">${escapeHtml(inviteLink)}</a>
          </p>
        </div>
      `,
    });

    return { error: null, success: true };
  } catch (err) {
    console.error('Email send error:', err);
    return {
      error: 'Wystąpił błąd podczas wysyłania. Spróbuj ponownie.',
      success: false,
    };
  }
}

// ---------------------------------------------------------------------------
// API key for the agent REST API (/api/v1)
// ---------------------------------------------------------------------------

/**
 * Find or create the family's system "Agent" profile that API writes are
 * attributed to. Profiles require a users row (PK/FK), so the agent gets a
 * synthetic user with an unusable password hash (bcrypt.compare always fails
 * against a non-bcrypt string) and an internal, per-family email.
 */
async function ensureAgentProfile(familyId: string): Promise<string> {
  const agentEmail = agentEmailFor(familyId);

  let [agentUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, agentEmail))
    .limit(1);

  if (!agentUser) {
    [agentUser] = await db
      .insert(users)
      .values({
        email: agentEmail,
        passwordHash: randomBytes(32).toString('hex'),
        loginDisabled: true,
      })
      .returning({ id: users.id });
  } else {
    // Defensively ensure the account can never be logged into, even if it
    // predates the loginDisabled flag or was created by another path.
    await db
      .update(users)
      .set({ loginDisabled: true })
      .where(eq(users.id, agentUser.id));
  }

  const [agentProfile] = await db
    .select({ id: profiles.id, familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, agentUser.id))
    .limit(1);

  if (!agentProfile) {
    await db.insert(profiles).values({
      id: agentUser.id,
      familyId,
      displayName: 'Agent',
    });
  } else if (agentProfile.familyId !== familyId) {
    await db
      .update(profiles)
      .set({ familyId })
      .where(eq(profiles.id, agentUser.id));
  }

  return agentUser.id;
}

export async function generateApiKey(): Promise<{
  success: boolean;
  error?: string;
  apiKey?: string;
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: 'Nie jesteś zalogowany' };

    const [profile] = await db
      .select({ familyId: profiles.familyId })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profile?.familyId) {
      return { success: false, error: 'Nie należysz do rodziny' };
    }

    const agentProfileId = await ensureAgentProfile(profile.familyId);

    // One active key per family — generating a new one revokes the old
    await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(apiKeys.familyId, profile.familyId), isNull(apiKeys.revokedAt)),
      );

    const apiKey = generateApiKeyString();
    await db.insert(apiKeys).values({
      familyId: profile.familyId,
      agentProfileId,
      keyHash: hashApiKey(apiKey),
      keyPrefix: apiKey.slice(0, 16),
    });

    revalidatePath('/settings');
    return { success: true, apiKey };
  } catch (error) {
    console.error('generateApiKey error:', error);
    return {
      success: false,
      error: 'Wystąpił błąd podczas generowania klucza',
    };
  }
}

export async function revokeApiKey(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: 'Nie jesteś zalogowany' };

    const [profile] = await db
      .select({ familyId: profiles.familyId })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profile?.familyId) {
      return { success: false, error: 'Nie należysz do rodziny' };
    }

    await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(apiKeys.familyId, profile.familyId), isNull(apiKeys.revokedAt)),
      );

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('revokeApiKey error:', error);
    return {
      success: false,
      error: 'Wystąpił błąd podczas unieważniania klucza',
    };
  }
}

// ---------------------------------------------------------------------------
// Search products for category management
// ---------------------------------------------------------------------------
export type ProductWithCategory = {
  id: string;
  name: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
};

export async function searchProductsForSettings(
  query: string,
): Promise<ProductWithCategory[]> {
  try {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const userId = await getCurrentUserId();
    if (!userId) return [];

    const [profile] = await db
      .select({ familyId: profiles.familyId })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profile?.familyId) return [];

    const matchedProducts = await db
      .select({
        id: products.id,
        name: products.name,
        categoryId: products.categoryId,
      })
      .from(products)
      .where(
        and(
          ilike(products.name, `%${trimmed}%`),
          or(
            isNull(products.familyId),
            eq(products.familyId, profile.familyId),
          ),
        ),
      )
      .orderBy(desc(products.usageCount))
      .limit(20);

    if (matchedProducts.length === 0) return [];

    // Fetch category info separately (same pattern as main actions.ts)
    const categoryIds = [
      ...new Set(matchedProducts.map((p) => p.categoryId).filter(Boolean)),
    ] as string[];

    const categoryMap: Record<string, { name: string; icon: string }> = {};
    if (categoryIds.length > 0) {
      const cats = await db
        .select({
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
        })
        .from(categories)
        .where(inArray(categories.id, categoryIds));

      for (const c of cats) {
        categoryMap[c.id] = { name: c.name, icon: c.icon };
      }
    }

    return matchedProducts.map((p) => ({
      id: p.id,
      name: p.name,
      categoryId: p.categoryId,
      categoryName: p.categoryId
        ? (categoryMap[p.categoryId]?.name ?? null)
        : null,
      categoryIcon: p.categoryId
        ? (categoryMap[p.categoryId]?.icon ?? null)
        : null,
    }));
  } catch (error) {
    console.error('searchProductsForSettings error:', error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Update product category (from settings)
// ---------------------------------------------------------------------------
export async function updateProductCategory(
  productId: string,
  categoryId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return { success: false, error: 'Nie jesteś zalogowany' };

    const [profile] = await db
      .select({ familyId: profiles.familyId })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profile?.familyId)
      return { success: false, error: 'Nie należysz do rodziny' };

    // The target category must be global or owned by this family.
    if (!(await isCategoryVisibleToFamily(categoryId, profile.familyId))) {
      return { success: false, error: 'Nieprawidłowa kategoria' };
    }

    // Get product to verify access and get name
    const [product] = await db
      .select({
        id: products.id,
        name: products.name,
        familyId: products.familyId,
      })
      .from(products)
      .where(
        and(
          eq(products.id, productId),
          or(
            isNull(products.familyId),
            eq(products.familyId, profile.familyId),
          ),
        ),
      )
      .limit(1);

    if (!product) return { success: false, error: 'Nie znaleziono produktu' };

    // Only allow editing family products (not global seed products)
    // If global, create a family-specific override
    if (product.familyId === null) {
      await db
        .insert(products)
        .values({
          name: product.name,
          categoryId,
          familyId: profile.familyId,
          usageCount: 0,
        })
        .onConflictDoUpdate({
          target: [products.name, products.familyId],
          set: { categoryId },
        });
    } else {
      await db
        .update(products)
        .set({ categoryId })
        .where(eq(products.id, productId));
    }

    // Also update any active shopping items with this product name
    await db
      .update(shoppingItems)
      .set({ categoryId })
      .where(
        and(
          eq(shoppingItems.familyId, profile.familyId),
          ilike(shoppingItems.productName, product.name),
        ),
      );

    revalidatePath('/');
    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('updateProductCategory error:', error);
    return { success: false, error: 'Wystąpił błąd podczas zmiany kategorii' };
  }
}
