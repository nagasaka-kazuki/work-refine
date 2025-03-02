import { PlusCircle, Trash2, Upload, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ChecklistItemComponent } from '@/components/checklist-item'
import { AddTaskCategoryForm } from '@/components/add-task-category'
import { AddChecklistItemForm } from './components/add-checklist-form'
import { useTaskCategories } from './hooks/use-task-categories'
import { useTaskCategoryFileOperations } from './hooks/use-task-category-file-operations'
import { DNDSortableArea } from './components/dnd-sortable-area'

export default function Home() {
  const {
    addChecklistItem,
    addTaskCategory,
    deleteChecklistItem,
    deleteTaskCategory,
    deletingCategory,
    handleAccordionValueChange,
    handleDragEnd,
    isAddingCategory,
    setDeletingCategory,
    setIsAddingCategory,
    setTaskCategories,
    taskCategories,
    toggleChecklistItem,
  } = useTaskCategories()

  const { exportJsonData, importTaskCategoryData } =
    useTaskCategoryFileOperations(taskCategories, setTaskCategories)

  return (
    <main className="container max-w-lg mx-auto p-4">
      <h1 className="text-xl font-bold mb-3 text-center">
        タスクチェックリスト
      </h1>

      {taskCategories.length > 0 ? (
        <Accordion
          type="multiple"
          className="mb-8"
          onValueChange={(value) => handleAccordionValueChange(value)}
          value={taskCategories
            .filter((category) => category.isOpen)
            .map((category) => category.id)}
        >
          {taskCategories.map((category) => (
            <AccordionItem key={category.id} value={category.id}>
              <div className="flex items-center py-1">
                <AccordionTrigger className="flex-1">
                  {category.name}
                </AccordionTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeletingCategory(category)
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" aria-label='削除'/>
                </Button>
              </div>
              <AccordionContent>
                <div className="space-y-2 mt-2 px-1">
                  <DNDSortableArea
                    itemKeys={category.items.map((item) => item.id)}
                    handleDragEnd={(activeDraggingItem, overItem) =>
                      handleDragEnd(activeDraggingItem, overItem, category.id)
                    }
                  >
                    {category.items.map((item) => (
                      <ChecklistItemComponent
                        key={item.id}
                        item={item}
                        onToggle={() =>
                          toggleChecklistItem(category.id, item.id)
                        }
                        onDelete={() =>
                          deleteChecklistItem(category.id, item.id)
                        }
                      />
                    ))}
                  </DNDSortableArea>

                  <AddChecklistItemForm
                    onAdd={(title) => addChecklistItem(category.id, title)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="text-center text-muted-foreground mb-8">
          タスクがありません。下のボタンから追加してください。
        </div>
      )}

      {isAddingCategory ? (
        <AddTaskCategoryForm
          onAdd={addTaskCategory}
          onCancel={() => setIsAddingCategory(false)}
        />
      ) : (
        <div>
          <Button onClick={() => setIsAddingCategory(true)} className="w-full">
            <PlusCircle className="h-5 w-5" />
            <span>新しいタスクを追加</span>
          </Button>

          <div className="w-full flex items-center gap-2 justify-end mt-2">
            <Button className="p-0">
              <label className="flex items-center gap-2 w-full px-3 py-2">
                <Download className="h-5 w-5" />
                インポート
                <Input
                  type="file"
                  accept=".json"
                  onChange={importTaskCategoryData}
                  className="hidden"
                />
              </label>
            </Button>

            <Button onClick={exportJsonData}>
              <Upload className="h-5 w-5" />
              エクスポート
            </Button>
          </div>
        </div>
      )}

      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={() => setDeletingCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>カテゴリの削除</AlertDialogTitle>
            <AlertDialogDescription>
              「{deletingCategory?.name}
              」を削除してもよろしいですか？この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingCategory && deleteTaskCategory(deletingCategory.id)
              }
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
