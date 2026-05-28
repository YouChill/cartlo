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
  const joinCode = (formData.get('joinCode') as string) || null;

  if (!email || !password) {
    return { error: 'Wypełnij wszystkie pola.' };
  }

  try {
    await signIn('credentials', {
      email: email.toLowerCase(),
      password,
      redirect: false,
    });
  } catch {
    return { error: 'Nieprawidłowy email lub hasło.' };
  }

  // If there's a join code, redirect to the join page
  if (joinCode) {
    redirect(`/join/${joinCode}`);
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
  const joinCode = (formData.get('joinCode') as string) || null;

  if (!email || !password || !confirmPassword) {
    return { error: 'Wypełnij wszystkie pola.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: 'Podaj poprawny adres email.' };
  }

  if (password.length < 6) {
    return { error: 'Hasło musi mieć minimum 6 znaków.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Hasła nie są identyczne.' };
  }

  const normalizedEmail = email.toLowerCase();

  // Check if email already exists
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existing) {
    return { error: 'Ten email jest już zarejestrowany.' };
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

  // Create profile. neon-http has no interactive transactions, so on failure
  // we compensate by removing the just-created user to avoid an orphaned
  // account that could never sign in or re-register.
  const displayName = normalizedEmail.split('@')[0];
  try {
    await db.insert(profiles).values({
      id: newUser.id,
      displayName,
    });
  } catch {
    await db.delete(users).where(eq(users.id, newUser.id));
    return { error: 'Nie udało się utworzyć konta. Spróbuj ponownie.' };
  }

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

  // If there's a join code, redirect to the join page
  if (joinCode) {
    redirect(`/join/${joinCode}`);
  }

  redirect('/onboarding');
}
