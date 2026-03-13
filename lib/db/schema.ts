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
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

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
