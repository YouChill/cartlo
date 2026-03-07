import Pusher from 'pusher';

let pusherInstance: Pusher | null = null;

export function getPusherServer() {
  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS: true,
    });
  }
  return pusherInstance;
}

/**
 * Notify all family members that the shopping list has changed.
 * Called from server actions after any mutation.
 */
export async function notifyListUpdate(familyId: string) {
  const pusher = getPusherServer();
  await pusher.trigger(`private-family-${familyId}`, 'list-updated', {
    timestamp: Date.now(),
  });
}
