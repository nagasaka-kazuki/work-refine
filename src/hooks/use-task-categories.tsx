import { useState } from 'react'
import { v4 } from 'uuid'
import type { TaskCategory, ChecklistItem } from '@/lib/types'
import { useLocalStorage } from './use-local-storage'
import { arrayMove } from '@dnd-kit/sortable'
import { saveAs } from 'file-saver'

export function useTaskCategories() {
  const [taskCategories, setTaskCategories] = useLocalStorage<TaskCategory[]>(
    'taskData',
    []
  )
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<TaskCategory | null>(
    null
  )

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

  const deleteTaskCategory = (categoryId: string) => {
    setTaskCategories((prev) =>
      prev.filter((category) => category.id !== categoryId)
    )
    setDeletingCategory(null)
  }

  const handleAccordionValueChange = (value: string[]) => {
    setTaskCategories((prev) =>
      prev.map((category) => ({
        ...category,
        isOpen: value.includes(category.id),
      }))
    )
  }

  const handleDragEnd = (
    draggedItemId: string,
    overedItemId: string | undefined,
    categoryId: string
  ) => {
    if (!overedItemId) return

    if (draggedItemId !== overedItemId) {
      const category = taskCategories.find(
        (category) => category.id === categoryId
      )
      if (!category) return

      const oldIndex = category.items.findIndex(
        (item) => item.id === draggedItemId
      )
      const newIndex = category.items.findIndex(
        (item) => item.id === overedItemId
      )

      const newItems = arrayMove(category.items, oldIndex, newIndex)

      setTaskCategories(
        taskCategories.map((cat) =>
          cat.id === categoryId ? { ...cat, items: newItems } : cat
        )
      )
    }
  }

  const exportTasksToJsonFile = () => {
    saveAs(
      new Blob(
        [
          JSON.stringify(
            taskCategories.map((c) => ({ ...c, isOpen: false })),
            null,
            2
          ),
        ],
        { type: 'application/json' }
      ),
      'taskData.json'
    )
  }

  const importTasksFileData = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const importedData: TaskCategory[] = JSON.parse(text)

      setTaskCategories((prev) => {
        const existingIds = new Set(prev.map((category) => category.id))
        return [
          ...prev,
          ...importedData.filter((category) => !existingIds.has(category.id)),
        ]
      })
    } catch (error) {
      console.error('ファイルの読み込みに失敗しました:', error)
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
    exportTasksToJsonFile,
    importTasksFileData,
  }
}
