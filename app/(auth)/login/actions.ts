'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type AuthFormState = {
  error: string | null;
};

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Wypelnij wszystkie pola.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message === 'Invalid login credentials') {
      return { error: 'Nieprawidlowy email lub haslo.' };
    }
    return { error: error.message };
  }

  // Check if user has a family
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('family_id')
      .eq('id', user.id)
      .single();

    if (profile?.family_id) {
      redirect('/');
    } else {
      redirect('/onboarding');
    }
  }

  redirect('/');
}

export async function signUp(
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

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Ten email jest juz zarejestrowany.' };
    }
    return { error: error.message };
  }

  redirect('/onboarding');
}
