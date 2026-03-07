'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPusherClient } from '@/lib/pusher/client';

/**
 * Subscribe to Pusher private channel for the family's shopping list.
 * When a `list-updated` event is received, triggers router.refresh()
 * to re-fetch server components with fresh data.
 *
 * Gracefully degrades to no-op if Pusher env vars are not configured.
 */
export function useRealtimeShoppingList(familyId: string) {
  const router = useRouter();

  useEffect(() => {
    const pusher = getPusherClient();

    if (!pusher) {
      return;
    }

    const channelName = `private-family-${familyId}`;
    const channel = pusher.subscribe(channelName);

    channel.bind('list-updated', () => {
      router.refresh();
    });

    // Reconnect handling: refetch on reconnect to catch missed events
    pusher.connection.bind('connected', () => {
      router.refresh();
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [familyId, router]);
}
