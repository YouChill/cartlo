import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SettingsClient } from './settings-client';

export const metadata = {
  title: 'Ustawienia — Cartlo',
};

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, family_id')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  return (
    <SettingsClient
      displayName={profile.display_name}
      email={user.email ?? ''}
    />
  );
}
