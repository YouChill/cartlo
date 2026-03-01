import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { FamilyClient } from './family-client';

export const metadata = {
  title: 'Rodzina — Cartlo',
};

export default async function FamilyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Get current user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('family_id, display_name')
    .eq('id', user.id)
    .single();

  if (!profile?.family_id) redirect('/onboarding');

  // Get family info
  const { data: family } = await supabase
    .from('families')
    .select('id, name, invite_code, created_at')
    .eq('id', profile.family_id)
    .single();

  if (!family) redirect('/onboarding');

  // Get all family members
  const { data: members } = await supabase
    .from('profiles')
    .select('id, display_name, created_at')
    .eq('family_id', family.id)
    .order('created_at', { ascending: true });

  return (
    <FamilyClient
      family={family}
      members={members ?? []}
      currentUserId={user.id}
    />
  );
}
