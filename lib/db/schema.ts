import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  uniqueIndex,
  index,
  customType,
} from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Custom pgvector type for embeddings
// ---------------------------------------------------------------------------

const vector = customType<{
  data: number[];
  driverData: string;
  config: { dimensions: number };
}>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 1536})`;
  },
  fromDriver(value: string): number[] {
    // pgvector returns vectors as '[0.1,0.2,...]' strings
    return value
      .slice(1, -1)
      .split(',')
      .map((v) => parseFloat(v));
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
});

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  // Non-loginable accounts (e.g. synthetic API "Agent" users). When true the
  // credentials flow rejects login regardless of the stored password hash.
  loginDisabled: boolean('login_disabled').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// One-time, single-use tokens for the "forgot password" flow. Only a SHA-256
// hash of the token is stored — the raw token exists solely in the email link.
export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('idx_password_reset_tokens_user_id').on(table.userId)],
);

export const families = pgTable('families', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  inviteCode: text('invite_code').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  familyId: uuid('family_id').references(() => families.id, {
    onDelete: 'set null',
  }),
  displayName: text('display_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  sortOrder: integer('sort_order').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  familyId: uuid('family_id').references(() => families.id, {
    onDelete: 'cascade',
  }),
});

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    categoryId: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    familyId: uuid('family_id').references(() => families.id, {
      onDelete: 'cascade',
    }),
    usageCount: integer('usage_count').notNull().default(0),
    embedding: vector('embedding', { dimensions: 1536 }),
  },
  (table) => [
    uniqueIndex('products_name_family_idx').on(table.name, table.familyId),
    // Global products (family_id IS NULL) must be unique by case-insensitive
    // name — the (name, family_id) index above does not enforce this because
    // Postgres treats NULLs as distinct. Also the seed's ON CONFLICT arbiter.
    uniqueIndex('products_global_name_uq')
      .on(sql`lower(${table.name})`)
      .where(sql`${table.familyId} IS NULL`),
  ],
);

export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const templateItems = pgTable('template_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id')
    .notNull()
    .references(() => templates.id, { onDelete: 'cascade' }),
  productName: text('product_name').notNull(),
  categoryId: uuid('category_id').references(() => categories.id, {
    onDelete: 'set null',
  }),
  quantity: numeric('quantity', { precision: 10, scale: 2 })
    .notNull()
    .default('1'),
  unit: text('unit').notNull().default('szt'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: uuid('family_id')
      .notNull()
      .references(() => families.id, { onDelete: 'cascade' }),
    agentProfileId: uuid('agent_profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull().default('Agent'),
    keyHash: text('key_hash').notNull().unique(),
    keyPrefix: text('key_prefix').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [index('idx_api_keys_family_id').on(table.familyId)],
);

export const shoppingItems = pgTable(
  'shopping_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    familyId: uuid('family_id')
      .notNull()
      .references(() => families.id, { onDelete: 'cascade' }),
    productName: text('product_name').notNull(),
    categoryId: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    quantity: numeric('quantity', { precision: 10, scale: 2 })
      .notNull()
      .default('1'),
    unit: text('unit').notNull().default('szt'),
    isChecked: boolean('is_checked').notNull().default(false),
    addedBy: uuid('added_by')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    checkedBy: uuid('checked_by').references(() => profiles.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    checkedAt: timestamp('checked_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_shopping_items_family_id').on(table.familyId),
    index('idx_shopping_items_family_checked').on(
      table.familyId,
      table.isChecked,
    ),
  ],
);
