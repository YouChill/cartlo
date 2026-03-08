'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { signOut as authSignOut, getCurrentUserId } from '@/lib/auth';
import { db } from '@/lib/db';
import { profiles, users } from '@/lib/db/schema';

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
    return { error: 'Podaj swoje imie.', success: false };
  }
  if (displayName.length < 2) {
    return { error: 'Imie musi miec minimum 2 znaki.', success: false };
  }
  if (displayName.length > 30) {
    return { error: 'Imie moze miec maksymalnie 30 znakow.', success: false };
  }

  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  await db
    .update(profiles)
    .set({ displayName })
    .where(eq(profiles.id, userId));

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
    return { error: 'Wypelnij wszystkie pola.', success: false };
  }
  if (newPassword.length < 6) {
    return {
      error: 'Nowe haslo musi miec minimum 6 znakow.',
      success: false,
    };
  }
  if (newPassword !== confirmPassword) {
    return { error: 'Hasla nie sa identyczne.', success: false };
  }

  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) redirect('/login');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return { error: 'Obecne haslo jest nieprawidlowe.', success: false };
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash: newHash })
    .where(eq(users.id, userId));

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
    return { error: 'Podaj prawidlowy adres email.', success: false };
  }

  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const [profile] = await db
    .select({ familyId: profiles.familyId, displayName: profiles.displayName })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile?.familyId) {
    return { error: 'Nie nalezysz do zadnej rodziny.', success: false };
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

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) {
    return {
      error: 'Wysylanie emaili nie jest skonfigurowane. Uzyj linku zaproszenia.',
      success: false,
    };
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');
  const inviteLink = `${baseUrl}/join/${family.inviteCode}`;

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT ?? '587'),
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `Cartlo <${smtpUser}>`,
      to: email,
      subject: `${profile.displayName} zaprasza Cie do rodziny "${family.name}" w Cartlo`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
          <h2 style="color: #1a1a1a; margin-bottom: 8px;">Dolacz do rodziny "${family.name}"</h2>
          <p style="color: #6b6b6b; font-size: 15px; line-height: 1.6;">
            ${profile.displayName} zaprasza Cie do wspolnej listy zakupow w <strong>Cartlo</strong>.
          </p>
          <a href="${inviteLink}"
             style="display: inline-block; margin-top: 16px; padding: 12px 24px;
                    background: #4ade80; color: #fff; font-weight: 600;
                    text-decoration: none; border-radius: 12px; font-size: 15px;">
            Dolacz do rodziny
          </a>
          <p style="margin-top: 24px; color: #9b9b9b; font-size: 13px;">
            Lub skopiuj link: <br/>
            <a href="${inviteLink}" style="color: #4ade80;">${inviteLink}</a>
          </p>
        </div>
      `,
    });

    return { error: null, success: true };
  } catch (err) {
    console.error('Email send error:', err);
    return {
      error: 'Wystapil blad podczas wysylania. Sprobuj ponownie.',
      success: false,
    };
  }
}
