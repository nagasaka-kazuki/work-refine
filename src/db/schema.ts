import { sql } from 'drizzle-orm'
import {
  integer,
  uuid,
  varchar,
  boolean,
  timestamp,
  pgTable,
  check,
} from 'drizzle-orm/pg-core'
import { z } from 'zod'
import { createSelectSchema, createInsertSchema } from 'drizzle-zod'

// カテゴリーテーブル
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => sql`now()`),
})

// チェック項目テーブル
export const check_items = pgTable(
  'check_items',
  {
    id: uuid('id').primaryKey(),
    category_id: uuid('category_id').references(() => categories.id, {
      onDelete: 'cascade',
    }),
    task_id: uuid('task_id').references(() => tasks.id, {
      onDelete: 'cascade',
    }),
    name: varchar('name', { length: 255 }).notNull(),
    sort_position: integer('sort_position').notNull(),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [
    check(
      'check_items_parent_xor',
      sql`
        (
          (${table.category_id} IS NOT NULL AND ${table.task_id} IS NULL)
          OR
          (${table.category_id} IS NULL AND ${table.task_id} IS NOT NULL)
        )
      `
    ),
  ]
)

// タスクテーブル
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey(),
  category_id: uuid('category_id')
    .references(() => categories.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  note: varchar('note', { length: 255 }),
  due_to: timestamp('due_to'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => sql`now()`),
})

// タスクチェックテーブル
export const task_checks = pgTable('task_checks', {
  id: uuid('id').primaryKey(),
  task_id: uuid('task_id')
    .references(() => tasks.id, { onDelete: 'cascade' })
    .notNull(),
  check_item_id: uuid('check_item_id')
    .references(() => check_items.id, { onDelete: 'cascade' })
    .notNull(),
  is_done: boolean('is_done').notNull().default(false),
  sort_position: integer('sort_position').notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => sql`now()`),
})

// ----- drizzle-zod スキーマ生成 -----
export const categoriesSelectSchema = createSelectSchema(categories)
export type Category = z.infer<typeof categoriesSelectSchema>

export const categoriesInsertSchema = createInsertSchema(categories)
export type CategoryInsert = z.infer<typeof categoriesInsertSchema>

export const checkItemsSelectSchema = createSelectSchema(check_items)
export type CheckItem = z.infer<typeof checkItemsSelectSchema>

export const checkItemsInsertSchema = createInsertSchema(check_items)
export type CheckItemInsert = z.infer<typeof checkItemsInsertSchema>

export const tasksSelectSchema = createSelectSchema(tasks)
export type Task = z.infer<typeof tasksSelectSchema>

export const tasksInsertSchema = createInsertSchema(tasks)
export type TaskInsert = z.infer<typeof tasksInsertSchema>

export const taskChecksSelectSchema = createSelectSchema(task_checks)
export type TaskCheck = z.infer<typeof taskChecksSelectSchema>

export const taskChecksInsertSchema = createInsertSchema(task_checks)
export type TaskCheckInsert = z.infer<typeof taskChecksInsertSchema>
