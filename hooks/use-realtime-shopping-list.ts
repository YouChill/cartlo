'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Subscribes to Supabase Realtime changes on the shopping_items table.
 * When a change is detected from another user, triggers a router.refresh()
 * to re-fetch server components with fresh data.
 */
export function useRealtimeShoppingList(familyId: string) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('shopping_items_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_items',
          filter: `family_id=eq.${familyId}`,
        },
        () => {
          // Refresh the page to re-fetch server data
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, router]);
}
