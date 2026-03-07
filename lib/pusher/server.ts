import Pusher from 'pusher';

let pusherInstance: Pusher | null = null;

export function getPusherServer(): Pusher | null {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    return null;
  }

  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    });
  }
  return pusherInstance;
}

/**
 * Notify all family members that the shopping list has changed.
 * Called from server actions after any mutation.
 * No-op if Pusher is not configured.
 */
export async function notifyListUpdate(familyId: string) {
  const pusher = getPusherServer();
  if (!pusher) return;

  await pusher.trigger(`private-family-${familyId}`, 'list-updated', {
    timestamp: Date.now(),
  });
}
