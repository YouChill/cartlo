import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BottomNav } from '@/components/layout/bottom-nav';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { AppHeader } from '@/components/layout/app-header';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  if (!profile?.family_id) redirect('/onboarding');

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* Desktop sidebar */}
      <SidebarNav />

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        <AppHeader displayName={profile.display_name} />

        <main className="flex-1 pb-20 lg:pb-0">
          <div className="mx-auto max-w-lg lg:max-w-2xl">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
