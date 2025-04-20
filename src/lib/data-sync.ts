// lib/data-sync.ts
import { db } from './db-client'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import {
  categories,
  tasks,
  check_items,
  task_checks,
  categoriesSelectSchema,
  tasksSelectSchema,
  checkItemsSelectSchema,
  taskChecksSelectSchema,
} from '@/db/schema'
import { sql } from 'drizzle-orm'

// Zod を使ってインポートペイロードを検証
const ImportPayloadSchema = z.object({
  categories: categoriesSelectSchema.array(),
  tasks: tasksSelectSchema.array(),
  check_items: checkItemsSelectSchema.array(),
  task_checks: taskChecksSelectSchema.array(),
})
export type ImportPayload = z.infer<typeof ImportPayloadSchema>

// データ内の日付文字列を Date に変換
function parseDates(payload: any): any {
  return {
    categories: payload.categories.map((c: any) => ({
      ...c,
      created_at: new Date(c.created_at),
      updated_at: new Date(c.updated_at),
    })),
    tasks: payload.tasks.map((t: any) => ({
      ...t,
      created_at: new Date(t.created_at),
      updated_at: new Date(t.updated_at),
      due_to: t.due_to ? new Date(t.due_to) : null,
    })),
    check_items: payload.check_items.map((i: any) => ({
      ...i,
      created_at: new Date(i.created_at),
      updated_at: new Date(i.updated_at),
    })),
    task_checks: payload.task_checks.map((tc: any) => ({
      ...tc,
      created_at: new Date(tc.created_at),
      updated_at: new Date(tc.updated_at),
    })),
  }
}

// 全データを JSON 化して Blob として返す
export async function exportAllData(): Promise<Blob> {
  const [cats, tks, items, checks] = await Promise.all([
    db.select().from(categories),
    db.select().from(tasks),
    db.select().from(check_items),
    db.select().from(task_checks),
  ])

  const payload: ImportPayload = {
    categories: cats,
    tasks: tks,
    check_items: items,
    task_checks: checks,
  }
  const json = JSON.stringify(payload, null, 2)
  return new Blob([json], { type: 'application/json' })
}

// JSON ファイルを読み込んで差分アップサート
export async function importDiffData(file: File): Promise<void> {
  // ファイル読み込み＆JSONパース
  const text = await file.text()
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('JSON のパースに失敗しました')
  }
  const typed = parseDates(raw)
  const {
    categories: cats,
    tasks: tks,
    check_items: items,
    task_checks: checks,
  } = ImportPayloadSchema.parse(typed)

  // トランザクションで差分アップサート
  await db.transaction(async (tx) => {
    // ── categories: name をキーに upsert ──
    if (cats.length > 0) {
      await tx
        .insert(categories)
        .values(
          cats.map((c) => ({
            id: c.id,
            name: c.name,
            created_at: c.created_at,
            updated_at: c.updated_at,
          }))
        )
        .onConflictDoUpdate({
          target: categories.id,
          set: {
            // excluded."updated_at"
            updated_at: sql.raw(`excluded."${categories.updated_at.name}"`),
          },
        })
    }

    // ── tasks: (name, category_id) をキーに upsert ──
    if (tks.length > 0) {
      await tx
        .insert(tasks)
        .values(
          tks.map((t) => ({
            id: t.id ?? uuidv4(),
            name: t.name,
            note: t.note,
            due_to: t.due_to,
            category_id: t.category_id!,
            created_at: t.created_at,
            updated_at: t.updated_at,
          }))
        )
        .onConflictDoUpdate({
          target: [tasks.id],
          set: {
            note: sql.raw(`excluded."${tasks.note.name}"`),
            due_to: sql.raw(`excluded."${tasks.due_to.name}"`),
            updated_at: sql.raw(`excluded."${tasks.updated_at.name}"`),
          },
        })
    }

    // ── check_items: (name, category_id) をキーに upsert ──
    if (items.length > 0) {
      await tx
        .insert(check_items)
        .values(
          items.map((i) => ({
            id: i.id ?? uuidv4(),
            name: i.name,
            sort_position: i.sort_position,
            category_id: i.category_id!,
            created_at: i.created_at,
            updated_at: i.updated_at,
          }))
        )
        .onConflictDoUpdate({
          target: [check_items.id],
          set: {
            sort_position: sql.raw(
              `excluded."${check_items.sort_position.name}"`
            ),
            updated_at: sql.raw(`excluded."${check_items.updated_at.name}"`),
          },
        })
    }

    // ── task_checks: (task_id, check_item_id) をキーに upsert ──
    if (checks.length > 0) {
      await tx
        .insert(task_checks)
        .values(
          checks.map((tc) => ({
            id: tc.id ?? uuidv4(),
            task_id: tc.task_id!,
            check_item_id: tc.check_item_id!,
            is_done: tc.is_done,
            sort_position: tc.sort_position,
            created_at: tc.created_at,
            updated_at: tc.updated_at,
          }))
        )
        .onConflictDoUpdate({
          target: [task_checks.id],
          set: {
            is_done: sql.raw(`excluded."${task_checks.is_done.name}"`),
            sort_position: sql.raw(
              `excluded."${task_checks.sort_position.name}"`
            ),
            updated_at: sql.raw(`excluded."${task_checks.updated_at.name}"`),
          },
        })
    }
  })
}
