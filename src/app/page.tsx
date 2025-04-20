'use client'

import { useState, useEffect } from 'react'
import { TaskList } from '@/components/task-list'
import { Sidebar } from '@/components/sidebar'
import { TopBar } from '@/components/top-bar'
import { CategoryModal } from '@/components/category-modal'
import { TaskModal } from '@/components/task-modal'
import { categories, tasks, check_items, task_checks } from '@/db/schema'
import { db, pgClient } from '@/lib/db-client'
import { v4 as uuidv4 } from 'uuid'
import { eq, inArray } from 'drizzle-orm'

type Props = {
  categoriesData: (typeof categories.$inferSelect)[]
  tasksData: (typeof tasks.$inferSelect)[]
  checkItemsData: (typeof check_items.$inferSelect)[]
  taskChecksData: (typeof task_checks.$inferSelect)[]
}

export default function Home({
  categoriesData,
  tasksData,
  checkItemsData,
  taskChecksData,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'due_to' | 'status' | 'created_at'>(
    'due_to'
  )
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<
    typeof categories.$inferSelect | null
  >(null)
  const [allCategories, setAllCategories] =
    useState<(typeof categories.$inferSelect)[]>(categoriesData)
  const [allTasks, setAllTasks] =
    useState<(typeof tasks.$inferSelect)[]>(tasksData)
  const [allCheckItems, setAllCheckItems] =
    useState<(typeof check_items.$inferSelect)[]>(checkItemsData)
  const [allTaskChecks, setAllTaskChecks] =
    useState<(typeof task_checks.$inferSelect)[]>(taskChecksData)
  const [liveSubscriptions, setLiveSubscriptions] = useState<
    Array<() => Promise<void>>
  >([])

  const setupLiveSubscriptions = async () => {
    // 既存の購読をクリーンアップ
    if (liveSubscriptions.length > 0) {
      await Promise.all(liveSubscriptions.map((unsub) => unsub()))
    }

    // 新しい購読をセットアップ
    const [catLive, taskLive, itemLive, checkLive] = await Promise.all([
      pgClient.live.query(db.select().from(categories).toSQL().sql, [], (res) =>
        setAllCategories((res as any).rows ?? res)
      ),
      pgClient.live.query(db.select().from(tasks).toSQL().sql, [], (res) =>
        setAllTasks((res as any).rows ?? res)
      ),
      pgClient.live.query(
        db.select().from(check_items).toSQL().sql,
        [],
        (res) => setAllCheckItems((res as any).rows ?? res)
      ),
      pgClient.live.query(
        db.select().from(task_checks).toSQL().sql,
        [],
        (res) => setAllTaskChecks((res as any).rows ?? res)
      ),
    ])

    // 新しい購読を保存
    setLiveSubscriptions([
      catLive.unsubscribe,
      taskLive.unsubscribe,
      itemLive.unsubscribe,
      checkLive.unsubscribe,
    ])
  }

  useEffect(() => {
    setupLiveSubscriptions()

    return () => {
      // クリーンアップ
      liveSubscriptions.forEach((unsub) => {
        unsub()
      })
    }
  }, [])

  const handleAddCategory = () => {
    setEditingCategory(null)
    setIsCategoryModalOpen(true)
  }

  const handleEditCategory = (category: any) => {
    setEditingCategory(category)
    setIsCategoryModalOpen(true)
  }

  const handleAddTask = () => {
    setIsTaskModalOpen(true)
  }

  const handleDataImported = () => {
    setupLiveSubscriptions()
  }

  const handleSaveCategory = async (
    categoryData: any,
    checkItemsData: any[]
  ) => {
    try {
      if (editingCategory) {
        // Update existing category
        await db
          .update(categories)
          .set({ name: categoryData.name, updated_at: new Date() })
          .where(eq(categories.id, editingCategory.id))

        // Get all tasks for this category before deleting check items
        const categoryTasks = allTasks.filter(
          (task) => task.category_id === editingCategory.id
        )

        // Delete existing check items for this category
        await db
          .delete(check_items)
          .where(eq(check_items.category_id, editingCategory.id))

        // Add new check items (バルク処理)
        const newCheckItems = checkItemsData.map((item, i) => {
          const checkItemId = uuidv4()
          return {
            id: checkItemId,
            category_id: editingCategory.id,
            name: item.name,
            sort_position: i,
            created_at: new Date(),
            updated_at: new Date(),
          }
        })

        if (newCheckItems.length > 0) {
          await db.insert(check_items).values(newCheckItems)
        }

        // Update all existing tasks with new check items (バルク処理)
        if (categoryTasks.length > 0) {
          // まず、すべてのタスクIDに対して一括で削除
          const taskIds = categoryTasks.map((task) => task.id)
          await db
            .delete(task_checks)
            .where(inArray(task_checks.task_id, taskIds))

          // 次に、すべてのタスクとチェック項目の組み合わせを作成して一括挿入
          const allTaskChecks = categoryTasks.flatMap((task) =>
            newCheckItems.map((checkItem) => ({
              id: uuidv4(),
              task_id: task.id,
              check_item_id: checkItem.id,
              is_done: false,
              sort_position: checkItem.sort_position,
              created_at: new Date(),
              updated_at: new Date(),
            }))
          )

          if (allTaskChecks.length > 0) {
            await db.insert(task_checks).values(allTaskChecks)
          }
        }
      } else {
        // Create new category
        const categoryId = uuidv4()
        await db.insert(categories).values({
          id: categoryId,
          name: categoryData.name,
          created_at: new Date(),
          updated_at: new Date(),
        })

        categoryData.id = categoryId

        // Add check items for new category (バルク処理)
        const newCheckItems = checkItemsData.map((item, i) => ({
          id: uuidv4(),
          category_id: categoryId,
          name: item.name,
          sort_position: i,
          created_at: new Date(),
          updated_at: new Date(),
        }))

        if (newCheckItems.length > 0) {
          await db.insert(check_items).values(newCheckItems)
        }
      }

      setIsCategoryModalOpen(false)
    } catch (error) {
      console.error('Error saving category:', error)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      // カテゴリを削除すると、関連するタスク、チェック項目、タスクチェックは
      // カスケード削除されるため、カテゴリのみを削除すれば良い
      await db.delete(categories).where(eq(categories.id, categoryId))

      // カテゴリが削除されたら、選択中のカテゴリをリセット
      if (selectedCategory === categoryId) {
        setSelectedCategory(null)
      }

      setIsCategoryModalOpen(false)
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const handleSaveTask = async (taskData: any) => {
    try {
      const taskId = uuidv4()

      // Insert task
      await db.insert(tasks).values({
        id: taskId,
        category_id: taskData.category_id,
        name: taskData.name,
        note: taskData.note || '',
        due_to: taskData.due_to ? new Date(taskData.due_to) : null,
        created_at: new Date(),
        updated_at: new Date(),
      })

      // Insert task checks for each check item in the category (バルク処理)
      const categoryCheckItems = allCheckItems.filter(
        (item) => item.category_id === taskData.category_id
      )

      const taskChecksToInsert = categoryCheckItems.map((checkItem) => ({
        id: uuidv4(),
        task_id: taskId,
        check_item_id: checkItem.id,
        is_done: false,
        sort_position: checkItem.sort_position,
        created_at: new Date(),
        updated_at: new Date(),
      }))

      if (taskChecksToInsert.length > 0) {
        await db.insert(task_checks).values(taskChecksToInsert)
      }

      setIsTaskModalOpen(false)
    } catch (error) {
      console.error('Error saving task:', error)
    }
  }

  // Calculate task status for sorting
  const getTaskStatus = (taskId: string) => {
    const taskCheckItems = allTaskChecks.filter(
      (check) => check.task_id === taskId
    )

    if (taskCheckItems.length === 0) return 'todo'

    const completedChecks = taskCheckItems.filter(
      (check) => check.is_done
    ).length

    if (completedChecks === 0) return 'todo'
    if (completedChecks === taskCheckItems.length) return 'done'
    return 'doing'
  }

  const filteredTasks = selectedCategory
    ? allTasks.filter((task) => task.category_id === selectedCategory)
    : allTasks

  return (
    <div className="flex h-screen flex-col">
      <TopBar
        onAddTask={handleAddTask}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onDataImported={handleDataImported}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          categories={allCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onAddCategory={handleAddCategory}
          onEditCategory={handleEditCategory}
        />

        <main className="flex-1 overflow-auto p-4">
          <TaskList
            tasks={filteredTasks}
            categories={allCategories}
            checkItems={allCheckItems}
            taskChecks={allTaskChecks}
            sortBy={sortBy}
            getTaskStatus={getTaskStatus}
          />
        </main>
      </div>

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        onDelete={handleDeleteCategory}
        category={editingCategory}
        checkItems={
          editingCategory
            ? allCheckItems.filter(
                (item) => item.category_id === editingCategory.id
              )
            : []
        }
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        categories={allCategories}
      />
    </div>
  )
}
