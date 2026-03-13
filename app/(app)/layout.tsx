import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/auth';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { BottomNav } from '@/components/layout/bottom-nav';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { AppHeader } from '@/components/layout/app-header';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const [profile] = await db
    .select({ displayName: profiles.displayName, familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile?.familyId) redirect('/onboarding');

  return (
    <div className="flex min-h-dvh w-full overflow-x-hidden bg-[var(--background)]">
      {/* Desktop sidebar */}
      <SidebarNav />

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader displayName={profile.displayName} />

        <main className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
          <div className="mx-auto max-w-lg lg:max-w-2xl">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
