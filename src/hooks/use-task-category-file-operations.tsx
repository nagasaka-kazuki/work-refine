import type React from 'react'
import { saveAs } from 'file-saver'
import type { TaskCategory } from '@/lib/types'

export function useTaskCategoryFileOperations(
  taskCategories: TaskCategory[],
  setTaskCategories: React.Dispatch<React.SetStateAction<TaskCategory[]>>
) {
  const exportJsonData = () => {
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

  const importTaskCategoryData = async (
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
    exportJsonData,
    importTaskCategoryData,
  }
}
