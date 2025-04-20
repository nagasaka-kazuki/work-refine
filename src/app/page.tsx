'use client'

import { useState } from 'react'
import { TaskList } from '@/components/task-list'
import { Sidebar } from '@/components/sidebar'
import { TopBar } from '@/components/top-bar'
import { CategoryModal } from '@/components/category-modal'
import { TaskModal } from '@/components/task-modal'
import { categories, Category, Task, CheckItem, TaskCheck } from '@/db/schema'
import { CategoryRepository } from '@/lib/repositories/categories'
import { TaskRepository } from '@/lib/repositories/tasks'
import { useLiveSync } from '@/hooks/use-live-sync'

type Props = {
  categoriesData: Category[]
  tasksData: Task[]
  checkItemsData: CheckItem[]
  taskChecksData: TaskCheck[]
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
  const { allCategories, allTasks, allCheckItems, allTaskChecks } = useLiveSync(
    categoriesData,
    tasksData,
    checkItemsData,
    taskChecksData
  )

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
