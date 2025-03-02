import { PlusCircle, Trash2, Upload, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Toaster } from '@/components/ui/sonner'
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
import { CheckboxSortableItem } from '@/components/checkbox-sortable-item'
import { useTaskCategories } from './hooks/use-task-categories'
import { DNDSortableArea } from './components/dnd-sortable-area'
import { InputForm } from './components/input-form'

export default function Home() {
  const {
    addChecklistItem,
    addTaskCategory,
    deleteChecklistItem,
    resetCheckInTask,
    deleteTaskCategory,
    deletingCategory,
    handleAccordionValueChange,
    handleDragEnd,
    isAddingCategory,
    setDeletingCategory,
    setIsAddingCategory,
    taskCategories,
    toggleChecklistItem,
    exportTasksToJsonFile,
    importTasksFileData,
  } = useTaskCategories()

  return (
    <main className="container max-w-lg mx-auto p-4 grid gap-8">
      <h1 className="text-xl font-bold text-center">タスクチェッカー</h1>

      {taskCategories.length > 0 ? (
        <Accordion
          type="multiple"
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
                  <Trash2 className="h-4 w-4" aria-label="削除" />
                </Button>
              </div>
              <AccordionContent>
                <div className="px-1">
                  <div className="flex justify-end">
                    <Button
                      variant="link"
                      size="sm"
                      className="text-gray-400 text-xs px-0 pt-1"
                      onClick={() => resetCheckInTask(category.id)}
                    >
                      チェックをリセットする
                    </Button>
                  </div>
                  <DNDSortableArea
                    itemKeys={category.items.map((item) => item.id)}
                    handleDragEnd={(activeDraggingItem, overItem) =>
                      handleDragEnd(activeDraggingItem, overItem, category.id)
                    }
                  >
                    {category.items.map((item) => (
                      <CheckboxSortableItem
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

                  <InputForm
                    onAdd={(title) => addChecklistItem(category.id, title)}
                    placeholder="チェック項目名"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="text-center text-muted-foreground">
          タスクがありません。下のボタンから追加してください。
        </div>
      )}

      {isAddingCategory ? (
        <InputForm
          onAdd={addTaskCategory}
          onCancel={() => setIsAddingCategory(false)}
          placeholder="タスク名"
          showCancelButton={true}
          autoFocus={true}
        />
      ) : (
        <div>
          <Button onClick={() => setIsAddingCategory(true)} className="w-full">
            <PlusCircle className="h-5 w-5" />
            <span>新しいタスクを追加</span>
          </Button>

          <div className="w-full flex items-center gap-2 justify-end mt-4">
            <Button className="p-0">
              <label className="flex items-center gap-2 w-full px-3 py-2">
                <Download className="h-5 w-5" />
                インポート
                <Input
                  type="file"
                  accept=".json"
                  onChange={importTasksFileData}
                  className="hidden"
                />
              </label>
            </Button>

            <Button onClick={exportTasksToJsonFile}>
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
      <Toaster position="top-center" richColors />
    </main>
  )
}
