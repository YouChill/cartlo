'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getPusherClient } from '@/lib/pusher/client';

/**
 * Subscribe to Pusher private channel for the family's shopping list.
 * When a `list-updated` event is received, triggers router.refresh()
 * to re-fetch server components with fresh data.
 */
export function useRealtimeShoppingList(familyId: string) {
  const router = useRouter();
  const channelRef = useRef<ReturnType<
    ReturnType<typeof getPusherClient>['subscribe']
  > | null>(null);

  useEffect(() => {
    const pusher = getPusherClient();
    const channelName = `private-family-${familyId}`;

    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

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
      channelRef.current = null;
    };
  }, [familyId, router]);
}
