import { useState, useEffect } from 'react'
import { TaskList } from '@/components/task-list'
import { Sidebar } from '@/components/sidebar'
import { TopBar } from '@/components/top-bar'
import { CategoryModal } from '@/components/category-modal'
import { TaskModal } from '@/components/task-modal'
import { categories, tasks, check_items, task_checks } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { db, pgClient } from '@/lib/db-client'

type Props = {
  categoriesData: (typeof categories.$inferSelect)[]
  tasksData: (typeof tasks.$inferSelect)[]
  checkItemsData: (typeof check_items.$inferSelect)[]
  taskChecksData: (typeof task_checks.$inferSelect)[]
}

export function Home({
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

  useEffect(() => {
    // unsubscribe 関数を格納する配列
    let unsubscribers: Array<() => Promise<void>> = []

    // 非同期に初期ロードとライブ購読をまとめてセットアップ
    async function setupLiveAndLoad() {
      // 2) ライブクエリ購読（Promise なので await が必要）
      const [catLive, taskLive, itemLive, checkLive] = await Promise.all([
        pgClient.live.query(
          db.select().from(categories).toSQL().sql,
          [],
          (res) => setAllCategories((res as any).rows ?? res)
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

      // unsubscribe の参照を保存
      unsubscribers = [
        catLive.unsubscribe,
        taskLive.unsubscribe,
        itemLive.unsubscribe,
        checkLive.unsubscribe,
      ]
    }

    setupLiveAndLoad()

    // クリーンアップでは保存した unsubscribe をすべて実行
    return () => {
      unsubscribers.forEach((unsub) => {
        // 非同期関数ですが、戻り値は無視してOK
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

        // Delete existing check items for this category
        await db
          .delete(check_items)
          .where(eq(check_items.category_id, editingCategory.id))
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
      }

      // Add check items
      for (let i = 0; i < checkItemsData.length; i++) {
        const item = checkItemsData[i]
        await db.insert(check_items).values({
          id: uuidv4(),
          category_id: editingCategory ? editingCategory.id : categoryData.id,
          name: item.name,
          sort_position: i,
          created_at: new Date(),
          updated_at: new Date(),
        })
      }

      setIsCategoryModalOpen(false)
    } catch (error) {
      console.error('Error saving category:', error)
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
        status: 'todo',
        created_at: new Date(),
        updated_at: new Date(),
      })

      // Insert task checks for each check item in the category
      const categoryCheckItems = allCheckItems.filter(
        (item) => item.category_id === taskData.category_id
      )

      for (let i = 0; i < categoryCheckItems.length; i++) {
        const checkItem = categoryCheckItems[i]
        await db.insert(task_checks).values({
          id: uuidv4(),
          task_id: taskId,
          check_item_id: checkItem.id,
          is_done: false,
          sort_position: checkItem.sort_position,
          created_at: new Date(),
          updated_at: new Date(),
        })
      }

      setIsTaskModalOpen(false)
    } catch (error) {
      console.error('Error saving task:', error)
    }
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
          />
        </main>
      </div>

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
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
