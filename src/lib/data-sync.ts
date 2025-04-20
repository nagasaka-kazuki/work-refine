// lib/data-sync.ts
import { db } from './db-client'
import { v4 as uuidv4 } from 'uuid'
import { and, eq } from 'drizzle-orm'
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
  const text = await file.text()
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('JSON のパースに失敗しました')
  }

  // 日付を変換
  const typed = parseDates(raw)

  // Zod による検証
  const {
    categories: cats,
    tasks: tks,
    check_items: items,
    task_checks: checks,
  } = ImportPayloadSchema.parse(typed)

  // カテゴリの差分登録
  const nameToCatId = new Map<string, string>()
  for (const cat of cats) {
    nameToCatId.set(cat.name, cat.id)
    const exist = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.name, cat.name))
    if (exist.length === 0) {
      await db.insert(categories).values({ id: cat.id, name: cat.name })
    }
  }

  // タスクの差分登録
  const idToCatName = new Map(
    cats.map((c) => [c.id, c.name] as [string, string])
  )
  const nameToTaskId = new Map<string, string>()
  for (const tk of tks) {
    const catName = idToCatName.get(tk.category_id)!
    const catId = nameToCatId.get(catName)!
    const exist = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(and(eq(tasks.name, tk.name), eq(tasks.category_id, catId)))

    const taskId = exist.length ? exist[0].id : uuidv4()
    if (!exist.length) {
      await db.insert(tasks).values({
        id: taskId,
        name: tk.name,
        note: tk.note,
        due_to: tk.due_to,
        category_id: catId,
      })
    }
    nameToTaskId.set(`${tk.name}::${catId}`, taskId)
  }

  // チェック項目の差分登録
  const nameToItemId = new Map<string, string>()
  for (const it of items) {
    const catName = idToCatName.get(it.category_id!)!
    const catId = nameToCatId.get(catName)!
    const exist = await db
      .select({ id: check_items.id })
      .from(check_items)
      .where(
        and(eq(check_items.name, it.name), eq(check_items.category_id, catId))
      )

    const itemId = exist.length ? exist[0].id : uuidv4()
    if (!exist.length) {
      await db.insert(check_items).values({
        id: itemId,
        name: it.name,
        sort_position: it.sort_position,
        category_id: catId,
      })
    }
    nameToItemId.set(`${it.name}::${catId}`, itemId)
  }

  // タスクチェックの差分登録
  for (const ck of checks) {
    const parent = tks.find((t) => t.id === ck.task_id)!
    const catName = idToCatName.get(parent.category_id)!
    const taskKey = `${parent.name}::${nameToCatId.get(catName)}`
    const itemKey = `${items.find((i) => i.id === ck.check_item_id)!.name}::${nameToCatId.get(catName)}`

    const taskId = nameToTaskId.get(taskKey)!
    const itemId = nameToItemId.get(itemKey)!

    const exist = await db
      .select({ id: task_checks.id })
      .from(task_checks)
      .where(
        and(
          eq(task_checks.task_id, taskId),
          eq(task_checks.check_item_id, itemId)
        )
      )

    if (!exist.length) {
      await db.insert(task_checks).values({
        id: uuidv4(),
        task_id: taskId,
        check_item_id: itemId,
        is_done: ck.is_done,
        sort_position: ck.sort_position,
      })
    }
  }
}
