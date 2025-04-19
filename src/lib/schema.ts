import { sql } from "drizzle-orm"
import { integer, uuid, varchar, boolean, timestamp, pgEnum, pgTable } from "drizzle-orm/pg-core"

// スターテータス用 Enum 定義
export const taskStatuses = pgEnum("task_status", ["todo", "doing", "done"])

// カテゴリーテーブル
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => sql`now()`),
})

// チェック項目テーブル
export const check_items = pgTable("check_items", {
  id: uuid("id").primaryKey(),
  category_id: uuid("category_id")
    .references(() => categories.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  sort_position: integer("sort_position").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => sql`now()`),
})

// タスクテーブル
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey(),
  category_id: uuid("category_id")
    .references(() => categories.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  note: varchar("note", { length: 255 }),
  due_to: timestamp("due_to"),
  status: taskStatuses("status").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => sql`now()`),
})

// タスクチェックテーブル
export const task_checks = pgTable("task_checks", {
  id: uuid("id").primaryKey(),
  task_id: uuid("task_id")
    .references(() => tasks.id, { onDelete: "cascade" })
    .notNull(),
  check_item_id: uuid("check_item_id")
    .references(() => check_items.id, { onDelete: "cascade" })
    .notNull(),
  is_done: boolean("is_done").notNull().default(false),
  sort_position: integer("sort_position").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => sql`now()`),
})
