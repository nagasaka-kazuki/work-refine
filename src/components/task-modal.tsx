'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Category, Task } from '@/db/schema'
import { Trash2 } from 'lucide-react'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (task: any) => void
  onDelete?: (taskId: string) => void // 追加
  categories: Category[]
  task: Task | null // 追加: 編集時に渡されるタスク
}

export function TaskModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  categories,
  task,
}: TaskModalProps) {
  // ローカル日時を "YYYY-MM-DDThh:mm" 形式で取得
  const getLocalDatetime = () => {
    const now = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    const year = now.getFullYear()
    const month = pad(now.getMonth() + 1)
    const day = pad(now.getDate())
    const hours = pad(now.getHours())
    const minutes = pad(now.getMinutes())
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [note, setNote] = useState('')
  // datetime-local 用のステート
  const [dueTo, setDueTo] = useState<string>(getLocalDatetime())

  // フォームのリセット
  const resetForm = () => {
    setName('')
    setCategoryId('')
    setNote('')
    setDueTo(getLocalDatetime())
  }

  // モーダルが開かれたときにフォーム初期化
  useEffect(() => {
    if (isOpen) {
      if (task) {
        // 編集モード: 既存のタスクデータをセット
        setName(task.name || '')
        setCategoryId(task.category_id || '')
        setNote(task.note || '')

        // due_to が存在する場合、ローカルのdatetime-local形式に変換
        if (task.due_to) {
          const date = new Date(task.due_to)
          const pad = (n: number) => n.toString().padStart(2, '0')
          const year = date.getFullYear()
          const month = pad(date.getMonth() + 1)
          const day = pad(date.getDate())
          const hours = pad(date.getHours())
          const minutes = pad(date.getMinutes())
          setDueTo(`${year}-${month}-${day}T${hours}:${minutes}`)
        } else {
          setDueTo(getLocalDatetime())
        }
      } else {
        // 新規作成モード: フォームをリセット
        resetForm()
      }
    }
  }, [isOpen, task])

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSave = () => {
    if (!name.trim() || !categoryId) return

    const dueToDate = dueTo ? new Date(dueTo) : null

    onSave({
      id: task?.id, // 編集時はIDを渡す
      name,
      category_id: categoryId,
      note,
      due_to: dueToDate,
    })

    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? 'タスク編集' : 'タスク追加'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="task-name">タスク名</Label>
            <Input
              id="task-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="タスク名を入力"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">カテゴリ</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">メモ</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="メモを入力（任意）"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due-to">期日</Label>
            <Input
              id="due-to"
              type="datetime-local"
              value={dueTo}
              onChange={(e) => setDueTo(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          {task && onDelete && (
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm('このタスクを削除してもよろしいですか？')) {
                  onDelete(task.id)
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              削除
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || !categoryId}>
              保存
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
