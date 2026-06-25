import { sql } from 'drizzle-orm'
import {
  boolean,
  integer,
  index,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

import type { LayoutConfig } from '@/shared/types'
import type { AdapterAccountType } from '@auth/core/adapters'

export const users = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  password: text('password'),
})

export const accounts = pgTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
)

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ]
)

export const passwordResetTokens = pgTable(
  'password_reset_token',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('tokenHash').notNull().unique(),
    expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull(),
    usedAt: timestamp('usedAt', { mode: 'date' }),
    createdAt: timestamp('createdAt', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index('password_reset_token_user_idx').on(table.userId),
    index('password_reset_token_expires_idx').on(table.expiresAt),
  ]
)

export const emailVerificationTokens = pgTable(
  'email_verification_token',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('tokenHash').notNull().unique(),
    expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull(),
    usedAt: timestamp('usedAt', { mode: 'date' }),
    createdAt: timestamp('createdAt', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index('email_verification_token_user_idx').on(table.userId),
    index('email_verification_token_expires_idx').on(table.expiresAt),
  ]
)

export const accountEmailMessages = pgTable(
  'account_email_message',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    type: text('type').notNull(),
    recipientEmail: text('recipientEmail').notNull(),
    userId: text('userId').references(() => users.id, {
      onDelete: 'set null',
    }),
    status: text('status').notNull().default('pending'),
    provider: text('provider'),
    providerMessageId: text('providerMessageId'),
    idempotencyKey: text('idempotencyKey').notNull().unique(),
    subject: text('subject').notNull(),
    text: text('text').notNull(),
    html: text('html').notNull(),
    replyTo: text('replyTo'),
    attemptsCount: integer('attemptsCount').notNull().default(0),
    lastError: text('lastError'),
    nextRetryAt: timestamp('nextRetryAt', { mode: 'date' }),
    createdAt: timestamp('createdAt', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updatedAt', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
    sentAt: timestamp('sentAt', { mode: 'date' }),
  },
  (table) => [
    index('account_email_message_status_retry_idx').on(
      table.status,
      table.nextRetryAt
    ),
    index('account_email_message_user_idx').on(table.userId),
  ]
)

export const accountEmailEvents = pgTable(
  'account_email_event',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    provider: text('provider').notNull(),
    providerEventId: text('providerEventId').notNull().unique(),
    type: text('type').notNull(),
    providerMessageId: text('providerMessageId').notNull(),
    recipientEmail: text('recipientEmail').notNull(),
    accountEmailMessageId: text('accountEmailMessageId').references(
      () => accountEmailMessages.id,
      { onDelete: 'set null' }
    ),
    payloadJson: jsonb('payloadJson').notNull(),
    reason: text('reason'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull(),
    receivedAt: timestamp('receivedAt', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index('account_email_event_message_idx').on(table.accountEmailMessageId),
    index('account_email_event_provider_message_idx').on(
      table.providerMessageId
    ),
    index('account_email_event_recipient_idx').on(table.recipientEmail),
    index('account_email_event_type_idx').on(table.type),
  ]
)

export const accountEmailSuppressions = pgTable(
  'account_email_suppression',
  {
    email: text('email').primaryKey(),
    reason: text('reason').notNull(),
    source: text('source').notNull(),
    providerMessageId: text('providerMessageId'),
    createdAt: timestamp('createdAt', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updatedAt', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index('account_email_suppression_reason_idx').on(table.reason),
    index('account_email_suppression_provider_message_idx').on(
      table.providerMessageId
    ),
  ]
)

export const sharedBudgets = pgTable('shared_budget', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  createdByUserId: text('createdByUserId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  archivedAt: timestamp('archivedAt', { mode: 'date' }),
  createdAt: timestamp('createdAt', { mode: 'date' })
    .notNull()
    .default(sql`now()`),
})

export const sharedBudgetMembers = pgTable(
  'shared_budget_member',
  {
    sharedBudgetId: text('sharedBudgetId')
      .notNull()
      .references(() => sharedBudgets.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    isActive: boolean('isActive').notNull().default(false),
    joinedAt: timestamp('joinedAt', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    primaryKey({ columns: [table.sharedBudgetId, table.userId] }),
    index('shared_budget_member_user_idx').on(table.userId),
    uniqueIndex('shared_budget_member_one_active_per_user_idx')
      .on(table.userId)
      .where(sql`${table.isActive} = true`),
  ]
)

export const sharedBudgetInvites = pgTable(
  'shared_budget_invite',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sharedBudgetId: text('sharedBudgetId')
      .notNull()
      .references(() => sharedBudgets.id, { onDelete: 'cascade' }),
    createdByUserId: text('createdByUserId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('tokenHash').notNull().unique(),
    expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull(),
    acceptedAt: timestamp('acceptedAt', { mode: 'date' }),
    acceptedByUserId: text('acceptedByUserId').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('createdAt', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index('shared_budget_invite_budget_idx').on(table.sharedBudgetId),
    index('shared_budget_invite_expires_idx').on(table.expiresAt),
  ]
)

export const sharedBudgetWeeklyLimits = pgTable(
  'shared_budget_weekly_limit',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sharedBudgetId: text('sharedBudgetId')
      .notNull()
      .references(() => sharedBudgets.id, { onDelete: 'cascade' }),
    effectiveWeekStart: text('effectiveWeekStart').notNull(),
    amount: real('amount').notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [unique().on(table.sharedBudgetId, table.effectiveWeekStart)]
)

export const sharedBudgetCategories = pgTable(
  'shared_budget_category',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sharedBudgetId: text('sharedBudgetId')
      .notNull()
      .references(() => sharedBudgets.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    emoji: text('emoji').notNull(),
    archivedAt: timestamp('archivedAt', { mode: 'date' }),
    createdAt: timestamp('createdAt', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index('shared_budget_category_budget_idx').on(table.sharedBudgetId),
    uniqueIndex('shared_budget_category_active_name_idx')
      .on(table.sharedBudgetId, table.name)
      .where(sql`${table.archivedAt} is null`),
  ]
)

export const sharedBudgetKeywordMappings = pgTable(
  'shared_budget_keyword_mapping',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sharedBudgetId: text('sharedBudgetId')
      .notNull()
      .references(() => sharedBudgets.id, { onDelete: 'cascade' }),
    keyword: text('keyword').notNull(),
    sharedBudgetCategoryId: text('sharedBudgetCategoryId')
      .notNull()
      .references(() => sharedBudgetCategories.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index('shared_budget_keyword_mapping_budget_idx').on(table.sharedBudgetId),
    unique().on(table.sharedBudgetId, table.keyword),
  ]
)

export const expenses = pgTable('expense', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  date: text('date').notNull(),
  category: text('category').notNull(),
  emoji: text('emoji').notNull(),
  projectId: text('projectId'),
  sharedBudgetId: text('sharedBudgetId').references(() => sharedBudgets.id, {
    onDelete: 'set null',
  }),
  sharedBudgetCategoryId: text('sharedBudgetCategoryId').references(
    () => sharedBudgetCategories.id,
    { onDelete: 'set null' }
  ),
  operationType: text('operationType').notNull().default('expense'),
  createdAt: timestamp('createdAt', { mode: 'date' })
    .notNull()
    .default(sql`now()`),
})

export const categories = pgTable(
  'category',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    emoji: text('emoji').notNull(),
  },
  (table) => [unique().on(table.userId, table.name)]
)

export const keywordMappings = pgTable(
  'keyword_mapping',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    keyword: text('keyword').notNull(),
    categoryId: text('categoryId')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [unique().on(table.userId, table.keyword)]
)

export const projects = pgTable('project', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  budget: real('budget').notNull(),
  color: text('color').notNull(),
  createdAt: text('createdAt').notNull(),
})

export const allocationBuckets = pgTable('allocation_bucket', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  percentage: real('percentage').notNull(),
})

export const userSettings = pgTable('user_settings', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  weeklyLimit: real('weeklyLimit').notNull().default(10000),
  salaryDay: integer('salaryDay').notNull().default(10),
  advanceDay: integer('advanceDay').notNull().default(25),
  salary: real('salary').notNull().default(0),
})

export const weeklyBudgetLimits = pgTable(
  'weekly_budget_limit',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    effectiveWeekStart: text('effectiveWeekStart').notNull(),
    amount: real('amount').notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (table) => [unique().on(table.userId, table.effectiveWeekStart)]
)

export const layoutConfigs = pgTable('layout_config', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' })
    .unique(),
  config: jsonb('config').$type<LayoutConfig>().notNull(),
})
