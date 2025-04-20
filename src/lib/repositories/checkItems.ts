import { db } from '@/lib/db-client'
import { check_items, task_checks } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export const CheckItemRepository = {
  // カテゴリに紐づくチェック項目を一括作成
  bulkCreate: async (categoryId: string, names: string[]) => {
    const items = names.map((name, i) => ({
      id: uuidv4(),
      category_id: categoryId,
      name,
      sort_position: i,
      created_at: new Date(),
      updated_at: new Date(),
    }))
    if (items.length > 0) {
      await db.insert(check_items).values(items)
    }
  },

    createForTask: async (taskId: string, name: string) => {
    // まず既存のタスク固有チェック数を取得してソート位置を算出
    const existing = await db
      .select()
      .from(check_items)
      .where(eq(check_items.task_id, taskId))
    const position = existing.length

    // check_items テーブルに挿入
    const checkItemId = uuidv4()
    await db.insert(check_items).values({
      id: checkItemId,
      task_id: taskId,
      name,
      sort_position: position,
      created_at: new Date(),
      updated_at: new Date(),
    })

    // task_checks テーブルに紐付けレコードを挿入
    await db.insert(task_checks).values({
      id: uuidv4(),
      task_id: taskId,
      check_item_id: checkItemId,
      is_done: false,
      sort_position: position,
      created_at: new Date(),
      updated_at: new Date(),
    })
  },

  // チェック項目を ID で削除
  deleteById: async (id: string) => {
    await db.delete(check_items).where(eq(check_items.id, id))
  },

  // カテゴリごとに削除
  deleteByCategory: async (categoryId: string) => {
    await db.delete(check_items).where(eq(check_items.category_id, categoryId))
  },

  // 全チェック項目取得
  findAll: async () => {
    return await db.select().from(check_items)
  },
}
