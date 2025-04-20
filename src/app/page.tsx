'use client'

import { useState, useEffect } from 'react'
import { TaskList } from '@/components/task-list'
import { Sidebar } from '@/components/sidebar'
import { TopBar } from '@/components/top-bar'
import { CategoryModal } from '@/components/category-modal'
import { TaskModal } from '@/components/task-modal'
import { categories, tasks, check_items, task_checks } from '@/db/schema'
import { db, pgClient } from '@/lib/db-client'
import { CategoryRepository } from '@/lib/repositories/categories'
import { TaskRepository } from '@/lib/repositories/tasks'
import { CheckItemRepository } from '@/lib/repositories/checkItems'
import { TaskCheckRepository } from '@/lib/repositories/taskChecks'

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
  const [allCategories, setAllCategories] = useState(categoriesData)
  const [allTasks, setAllTasks] = useState(tasksData)
  const [allCheckItems, setAllCheckItems] = useState(checkItemsData)
  const [allTaskChecks, setAllTaskChecks] = useState(taskChecksData)
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
      liveSubscriptions.forEach((unsub) => unsub())
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
      const names = checkItemsData.map((item) => item.name)
      if (editingCategory) {
        await CategoryRepository.updateWithChecks(
          editingCategory.id,
          categoryData.name,
          names
        )
      } else {
        await CategoryRepository.create(categoryData.name, names)
      }
      setIsCategoryModalOpen(false)
    } catch (error) {
      console.error('Error saving category:', error)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await CategoryRepository.delete(categoryId)
      if (selectedCategory === categoryId) setSelectedCategory(null)
      setIsCategoryModalOpen(false)
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const handleSaveTask = async (taskData: any) => {
    try {
      await TaskRepository.createWithChecks(taskData)
      setIsTaskModalOpen(false)
    } catch (error) {
      console.error('Error saving task:', error)
    }
  }

  const getTaskStatus = (taskId: string) => {
    const checks = allTaskChecks.filter((c) => c.task_id === taskId)
    if (checks.length === 0) return 'todo'
    const completed = checks.filter((c) => c.is_done).length
    if (completed === 0) return 'todo'
    if (completed === checks.length) return 'done'
    return 'doing'
  }

  const filteredTasks = selectedCategory
    ? allTasks.filter((t) => t.category_id === selectedCategory)
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
