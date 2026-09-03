import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { purgeStaleResetTokens } from '@/lib/password-reset';

export const dynamic = 'force-dynamic';

/**
 * Vercel Cron target (see vercel.json). Vercel invokes cron routes with GET
 * and `Authorization: Bearer <CRON_SECRET>`; POST is accepted too so the job
 * can be triggered by hand.
 */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handle(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured' },
      { status: 503 },
    );
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deleted = await purgeStaleResetTokens();
  return NextResponse.json({ ok: true, deleted });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
