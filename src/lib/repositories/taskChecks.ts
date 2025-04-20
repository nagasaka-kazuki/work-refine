import { db } from '@/lib/db-client'
import { task_checks } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export const TaskCheckRepository = {
  // 単一のチェック完了状態をトグル更新
  toggleStatus: async (checkId: string, done: boolean) => {
    await db
      .update(task_checks)
      .set({ is_done: done, updated_at: new Date() })
      .where(eq(task_checks.id, checkId))
  },

  // タスクに紐づくすべての task_checks を削除
  deleteByTask: async (taskId: string) => {
    await db.delete(task_checks).where(eq(task_checks.task_id, taskId))
  },

  // 複数レコードを一括挿入
  bulkInsert: async (
    entries: Array<{
      task_id: string
      check_item_id: string
      sort_position: number
    }>
  ) => {
    const rows = entries.map((e) => ({
      id: uuidv4(),
      task_id: e.task_id,
      check_item_id: e.check_item_id,
      is_done: false,
      sort_position: e.sort_position,
      created_at: new Date(),
      updated_at: new Date(),
    }))
    if (rows.length > 0) {
      await db.insert(task_checks).values(rows)
    }
  },

  // 全 task_checks 取得
  findAll: async () => {
    return await db.select().from(task_checks)
  },
}
