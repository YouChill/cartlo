'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
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

  redirect('/login?reset=1');
}
