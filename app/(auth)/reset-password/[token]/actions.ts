'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { signIn } from '@/lib/auth';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { sendPasswordChangedEmail } from '@/lib/email/password-changed';
import { consumeResetToken, findValidResetToken } from '@/lib/password-reset';

export type ResetPasswordState = {
  error: string | null;
  /** True when the link itself is no longer usable (expired / already used). */
  invalidToken: boolean;
};

export async function resetPassword(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = ((formData.get('token') as string) ?? '').trim();
  const password = (formData.get('password') as string) ?? '';
  const confirmPassword = (formData.get('confirmPassword') as string) ?? '';

  if (!password || !confirmPassword) {
    return { error: 'Wypełnij wszystkie pola.', invalidToken: false };
  }
  if (password.length < 6) {
    return {
      error: 'Hasło musi mieć minimum 6 znaków.',
      invalidToken: false,
    };
  }
  if (password !== confirmPassword) {
    return { error: 'Hasła nie są identyczne.', invalidToken: false };
  }

  const valid = await findValidResetToken(token);
  if (!valid) {
    return {
      error: 'Ten link wygasł lub został już użyty. Poproś o nowy.',
      invalidToken: true,
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await consumeResetToken(valid, passwordHash);

  // Security notification — best effort, never blocks the flow.
  await sendPasswordChangedEmail(valid.email);

  // Sign the user in straight away so they land in the app, not on the login
  // form. If that fails for any reason, fall back to logging in manually.
  let signedIn = false;
  try {
    await signIn('credentials', {
      email: valid.email,
      password,
      redirect: false,
    });
    signedIn = true;
  } catch (err) {
    console.error('Auto sign-in after password reset failed:', err);
  }

  if (!signedIn) {
    redirect('/login?reset=1');
  }

  const [profile] = await db
    .select({ familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, valid.userId))
    .limit(1);

  redirect(profile?.familyId ? '/' : '/onboarding');
}
