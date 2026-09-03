import { createHash, randomBytes } from 'crypto';
import { and, eq, gt, isNotNull, isNull, lt, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { passwordResetTokens, users } from '@/lib/db/schema';

/**
 * True when a database error means the schema is behind the code — a table
 * (42P01 undefined_table) or column (42703 undefined_column) the reset flow
 * relies on does not exist yet, i.e. a migration in drizzle/ was not run.
 */
export function isSchemaOutOfDateError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; cause?: unknown };
  if (e.code === '42P01' || e.code === '42703') return true;
  return e.cause ? isSchemaOutOfDateError(e.cause) : false;
}

export const SCHEMA_OUT_OF_DATE_MESSAGE =
  'Baza danych nie ma jeszcze wymaganych zmian. Wykonaj zaległe migracje ' +
  'z katalogu drizzle/ (login_disabled, password_reset) lub npm run db:push.';

/** How long a reset link stays valid. */
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

/** Minimum gap between two reset emails for the same account. */
export const PASSWORD_RESET_COOLDOWN_MS = 60 * 1000; // 1 minute

/** SHA-256 hex digest of a raw token — the only form that is persisted. */
export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Tokens are 32 random bytes, URL-safe; anything else is rejected upfront. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function isWellFormedResetToken(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

/**
 * Create a fresh reset token for the user and return the raw value to embed
 * in the email link. Returns null when a token was issued very recently
 * (cooldown), so the caller can silently skip sending another email.
 */
export async function createPasswordResetToken(
  userId: string,
): Promise<string | null> {
  const [recent] = await db
    .select({ id: passwordResetTokens.id })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.userId, userId),
        isNull(passwordResetTokens.usedAt),
        gt(
          passwordResetTokens.createdAt,
          new Date(Date.now() - PASSWORD_RESET_COOLDOWN_MS),
        ),
      ),
    )
    .limit(1);

  if (recent) return null;

  const token = randomBytes(32).toString('base64url');

  await db.insert(passwordResetTokens).values({
    userId,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
  });

  return token;
}

export type ValidResetToken = {
  userId: string;
  email: string;
};

/**
 * Look up a raw token and return its owner when it exists, is unused and has
 * not expired. Returns null otherwise — callers must not reveal which check
 * failed.
 */
export async function findValidResetToken(
  token: string,
): Promise<ValidResetToken | null> {
  if (!isWellFormedResetToken(token)) return null;

  const tokenHash = hashResetToken(token);

  const [row] = await db
    .select({
      userId: passwordResetTokens.userId,
      email: users.email,
      expiresAt: passwordResetTokens.expiresAt,
      usedAt: passwordResetTokens.usedAt,
      loginDisabled: users.loginDisabled,
    })
    .from(passwordResetTokens)
    .innerJoin(users, eq(users.id, passwordResetTokens.userId))
    .where(eq(passwordResetTokens.tokenHash, tokenHash))
    .limit(1);

  if (!row) return null;
  if (row.usedAt) return null;
  if (row.expiresAt.getTime() <= Date.now()) return null;
  if (row.loginDisabled) return null;

  return { userId: row.userId, email: row.email };
}

/**
 * Set a new password for the token's owner, burn the token and invalidate
 * every other outstanding reset token for that user.
 */
export async function consumeResetToken(
  valid: ValidResetToken,
  newPasswordHash: string,
): Promise<void> {
  const now = new Date();

  await db
    .update(users)
    .set({ passwordHash: newPasswordHash })
    .where(eq(users.id, valid.userId));

  await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(passwordResetTokens.userId, valid.userId),
        isNull(passwordResetTokens.usedAt),
      ),
    );
}

/**
 * Delete tokens that can never be used again: expired ones and ones already
 * consumed. Returns the number of removed rows. Safe to run at any time —
 * the cooldown check only considers unused tokens younger than a minute.
 */
export async function purgeStaleResetTokens(): Promise<number> {
  const deleted = await db
    .delete(passwordResetTokens)
    .where(
      or(
        lt(passwordResetTokens.expiresAt, new Date()),
        isNotNull(passwordResetTokens.usedAt),
      ),
    )
    .returning({ id: passwordResetTokens.id });

  return deleted.length;
}
