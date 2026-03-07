'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { signIn } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, profiles } from '@/lib/db/schema';

export type AuthFormState = {
  error: string | null;
};

export async function login(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Wypelnij wszystkie pola.' };
  }

  try {
    await signIn('credentials', {
      email: email.toLowerCase(),
      password,
      redirect: false,
    });
  } catch {
    return { error: 'Nieprawidlowy email lub haslo.' };
  }

  // Check if user has a family
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (user) {
    const [profile] = await db
      .select({ familyId: profiles.familyId })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (profile?.familyId) {
      redirect('/');
    } else {
      redirect('/onboarding');
    }
  }

  redirect('/');
}

export async function register(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!email || !password || !confirmPassword) {
    return { error: 'Wypelnij wszystkie pola.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: 'Podaj poprawny adres email.' };
  }

  if (password.length < 6) {
    return { error: 'Haslo musi miec minimum 6 znakow.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Hasla nie sa identyczne.' };
  }

  const normalizedEmail = email.toLowerCase();

  // Check if email already exists
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing) {
    return { error: 'Ten email jest juz zarejestrowany.' };
  }

  // Create user
  const passwordHash = await bcrypt.hash(password, 12);

  const [newUser] = await db
    .insert(users)
    .values({
      email: normalizedEmail,
      passwordHash,
    })
    .returning({ id: users.id });

  // Create profile
  const displayName = normalizedEmail.split('@')[0];
  await db.insert(profiles).values({
    id: newUser.id,
    displayName,
  });

  // Sign in immediately
  try {
    await signIn('credentials', {
      email: normalizedEmail,
      password,
      redirect: false,
    });
  } catch {
    // Sign in might throw on redirect, that's ok
  }

  redirect('/onboarding');
}
