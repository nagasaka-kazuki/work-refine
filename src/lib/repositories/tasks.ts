import { db } from '@/lib/db-client'
import { tasks, check_items, task_checks } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export const TaskRepository = {
  // タスク作成＋そのカテゴリのチェック項目に応じた task_checks も同時作成
  createWithChecks: async (data: {
    category_id: string
    name: string
    note?: string
    due_to?: string | null
  }) => {
    const taskId = uuidv4()
    await db.insert(tasks).values({
      id: taskId,
      category_id: data.category_id,
      name: data.name,
      note: data.note ?? '',
      due_to: data.due_to ? new Date(data.due_to) : null,
      created_at: new Date(),
      updated_at: new Date(),
    })

    // カテゴリに紐づくチェック項目を取得
    const items = await db
      .select()
      .from(check_items)
      .where(eq(check_items.category_id, data.category_id))

    if (items.length > 0) {
      const checks = items.map((item) => ({
        id: uuidv4(),
        task_id: taskId,
        check_item_id: item.id,
        is_done: false,
        sort_position: item.sort_position,
        created_at: new Date(),
        updated_at: new Date(),
      }))
      await db.insert(task_checks).values(checks)
    }

    return taskId
  },

  // タスク更新
  update: async (
    taskId: string,
    updateData: {
      name?: string
      note?: string
      due_to?: string | null
    }
  ) => {
    await db
      .update(tasks)
      .set({
        ...updateData,
        due_to: updateData.due_to ? new Date(updateData.due_to) : null,
      })
      .where(eq(tasks.id, taskId))
  },

  // タスク削除（FK カスケード前提）
  delete: async (taskId: string) => {
    await db.delete(tasks).where(eq(tasks.id, taskId))
  },

  // カテゴリごとのタスク取得
  findByCategory: async (categoryId: string) => {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.category_id, categoryId))
  },

  // 全タスク取得
  findAll: async () => {
    return await db.select().from(tasks)
  },
}
