import { db } from '@/lib/db-client'
import { categories, check_items, task_checks, tasks } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export const CategoryRepository = {
  // 新規カテゴリ＋チェック項目の作成
  create: async (name: string, itemNames: string[]) => {
    const categoryId = uuidv4()
    await db.insert(categories).values({
      id: categoryId,
      name,
      created_at: new Date(),
      updated_at: new Date(),
    })

    if (itemNames.length > 0) {
      const items = itemNames.map((n, i) => ({
        id: uuidv4(),
        category_id: categoryId,
        name: n,
        sort_position: i,
        created_at: new Date(),
        updated_at: new Date(),
      }))
      await db.insert(check_items).values(items)
    }

    return categoryId
  },

  // カテゴリ名とそのチェック項目を一括更新
  updateWithChecks: async (
    categoryId: string,
    newName: string,
    itemNames: string[]
  ) => {
    // カテゴリ名更新
    await db
      .update(categories)
      .set({ name: newName, updated_at: new Date() })
      .where(eq(categories.id, categoryId))

    // このカテゴリのタスク一覧取得
    const categoryTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.category_id, categoryId))
    const taskIds = categoryTasks.map((t) => t.id)

    // 既存チェック項目・タスクチェックを削除
    await db.delete(check_items).where(eq(check_items.category_id, categoryId))
    if (taskIds.length > 0) {
      await db
        .delete(task_checks)
        .where(inArray(task_checks.task_id, taskIds))
    }

    // 新しいチェック項目を作成
    const newItems = itemNames.map((n, i) => ({
      id: uuidv4(),
      category_id: categoryId,
      name: n,
      sort_position: i,
      created_at: new Date(),
      updated_at: new Date(),
    }))
    if (newItems.length > 0) {
      await db.insert(check_items).values(newItems)
    }

    // 既存タスクに対して task_checks を再作成
    if (categoryTasks.length > 0 && newItems.length > 0) {
      const allChecks = categoryTasks.flatMap((t) =>
        newItems.map((item) => ({
          id: uuidv4(),
          task_id: t.id,
          check_item_id: item.id,
          is_done: false,
          sort_position: item.sort_position,
          created_at: new Date(),
          updated_at: new Date(),
        }))
      )
      if (allChecks.length > 0) {
        await db.insert(task_checks).values(allChecks)
      }
    }
  },

  // カテゴリ削除（FK カスケード前提）
  delete: async (categoryId: string) => {
    await db.delete(categories).where(eq(categories.id, categoryId))
  },

  // 全カテゴリ取得
  findAll: async () => {
    return await db.select().from(categories)
  },
}
