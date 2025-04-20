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
import {  X, Plus, Trash2 } from 'lucide-react'
import { DialogDescription } from '@radix-ui/react-dialog'

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (category: any, checkItems: any[]) => void
  onDelete?: (categoryId: string) => void
  category: any | null
  checkItems: any[]
}

export function CategoryModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  category,
  checkItems,
}: CategoryModalProps) {
  const [name, setName] = useState('')
  const [items, setItems] = useState<
    { id?: string; name: string; sort_position: number }[]
  >([])

  useEffect(() => {
    if (category) {
      setName(category.name)
      setItems(
        checkItems.length > 0
          ? [...checkItems].sort((a, b) => a.sort_position - b.sort_position)
          : []
      )
    } else {
      setName('')
      setItems([{ name: '', sort_position: 0 }])
    }
  }, [category, checkItems, isOpen])

  const handleAddItem = () => {
    setItems((prev) => [...prev, { name: '', sort_position: prev.length }])
  }

  const handleRemoveItem = (index: number) => {
    setItems((prev) => {
      const arr = [...prev]
      arr.splice(index, 1)
      return arr.map((item, idx) => ({ ...item, sort_position: idx }))
    })
  }

  const handleItemChange = (index: number, value: string) => {
    setItems((prev) => {
      const arr = [...prev]
      arr[index].name = value
      return arr
    })
  }

  const handleSave = () => {
    if (!name.trim()) return
    const validItems = items.filter((item) => item.name.trim() !== '')
    onSave({ id: category?.id, name }, validItems)
    onClose()
  }

  const handleDelete = () => {
    if (category && onDelete) {
      onDelete(category.id)
      onClose()
    }
  }

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length) return
    setItems((prev) => {
      const arr = [...prev]
      const [moved] = arr.splice(fromIndex, 1)
      arr.splice(toIndex, 0, moved)
      return arr.map((item, idx) => ({ ...item, sort_position: idx }))
    })
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {category ? 'カテゴリ編集' : 'カテゴリ追加'}
            </DialogTitle>
            <DialogDescription className='sr-only'>カテゴリを編集するダイアログ</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">カテゴリ名</Label>
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="カテゴリ名を入力"
              />
            </div>

            <div className="space-y-2">
              <Label>チェック項目</Label>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">

                    <Input
                      value={item.name}
                      onChange={(e) => handleItemChange(index, e.target.value)}
                      placeholder={`チェック項目 ${index + 1}`}
                      className="flex-1"
                    />

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveItem(index, index - 1)}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveItem(index, index + 1)}
                        disabled={index === items.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleAddItem}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  チェック項目を追加
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between">
            {category && onDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                削除
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button onClick={handleSave} disabled={!name.trim()}>
                保存
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
