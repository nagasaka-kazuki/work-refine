import { useState } from 'react'
import { v4 } from 'uuid'
import type { TaskCategory, ChecklistItem } from '@/lib/types'
import { useLocalStorage } from './use-local-storage'
import { arrayMove } from '@dnd-kit/sortable'

export function useTaskCategories() {
  const [taskCategories, setTaskCategories] = useLocalStorage<TaskCategory[]>(
    'taskData',
    []
  )
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<TaskCategory | null>(
    null
  )

  // チェックボックスの状態を変更
  const toggleChecklistItem = (categoryId: string, itemId: string) => {
    setTaskCategories((prev) =>
      prev.map((category) => {
        if (category.id === categoryId) {
          return {
            ...category,
            items: category.items.map((item) =>
              item.id === itemId
                ? { ...item, completed: !item.completed }
                : item
            ),
          }
        }
        return category
      })
    )
  }

  // チェックリストアイテムを削除
  const deleteChecklistItem = (categoryId: string, itemId: string) => {
    setTaskCategories((prev) =>
      prev.map((category) => {
        if (category.id === categoryId) {
          return {
            ...category,
            items: category.items.filter((item) => item.id !== itemId),
          }
        }
        return category
      })
    )
  }

  // 新しいチェックリストアイテムを追加
  const addChecklistItem = (categoryId: string, title: string) => {
    if (title.trim()) {
      const newItem: ChecklistItem = {
        id: v4(),
        title,
        completed: false,
      }

      setTaskCategories((prev) =>
        prev.map((category) => {
          if (category.id === categoryId) {
            return {
              ...category,
              items: [...category.items, newItem],
            }
          }
          return category
        })
      )
    }
  }

  // 新しいタスクカテゴリを追加
  const addTaskCategory = (name: string) => {
    if (name.trim()) {
      const newCategory: TaskCategory = {
        id: v4(),
        isOpen: false,
        name,
        items: [],
      }

      setTaskCategories((prev) => [...prev, newCategory])
      setIsAddingCategory(false)
    }
  }

  // タスクカテゴリを削除
  const deleteTaskCategory = (categoryId: string) => {
    setTaskCategories((prev) =>
      prev.filter((category) => category.id !== categoryId)
    )
    setDeletingCategory(null)
  }

  // アコーディオンの開閉状態を管理
  const handleAccordionValueChange = (value: string[]) => {
    setTaskCategories((prev) =>
      prev.map((category) => ({
        ...category,
        isOpen: value.includes(category.id),
      }))
    )
  }

  // ドラッグ終了時の処理
  const handleDragEnd = (
    draggedItemId: string,
    overedtemId: string | undefined,
    categoryId: string
  ) => {
    if (!overedtemId) return

    if (draggedItemId !== overedtemId) {
      const category = taskCategories.find(
        (category) => category.id === categoryId
      )
      if (!category) return

      const oldIndex = category.items.findIndex(
        (item) => item.id === draggedItemId
      )
      const newIndex = category.items.findIndex(
        (item) => item.id === overedtemId
      )

      const newItems = arrayMove(category.items, oldIndex, newIndex)

      setTaskCategories(
        taskCategories.map((cat) =>
          cat.id === categoryId ? { ...cat, items: newItems } : cat
        )
      )
    }
  }

  return {
    taskCategories,
    setTaskCategories,
    isAddingCategory,
    deletingCategory,
    setIsAddingCategory,
    setDeletingCategory,
    toggleChecklistItem,
    deleteChecklistItem,
    addChecklistItem,
    addTaskCategory,
    deleteTaskCategory,
    handleAccordionValueChange,
    handleDragEnd,
  }
}
