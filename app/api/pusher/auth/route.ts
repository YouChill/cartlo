import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { getPusherServer } from '@/lib/pusher/server';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.formData();
  const socketId = body.get('socket_id') as string;
  const channelName = body.get('channel_name') as string;

  if (!socketId || !channelName) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  // Verify user belongs to the family in the channel name
  // Channel format: private-family-{familyId}
  const match = channelName.match(/^private-family-(.+)$/);
  if (!match) {
    return NextResponse.json({ error: 'Invalid channel' }, { status: 403 });
  }

  const familyId = match[1];

  const [profile] = await db
    .select({ familyId: profiles.familyId })
    .from(profiles)
    .where(eq(profiles.id, session.user.id))
    .limit(1);

  if (!profile || profile.familyId !== familyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const pusher = getPusherServer();
  const authResponse = pusher.authorizeChannel(socketId, channelName);

  return NextResponse.json(authResponse);
}
