"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GripVertical, X, Plus } from "lucide-react"

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (category: any, checkItems: any[]) => void
  category: any | null
  checkItems: any[]
}

export function CategoryModal({ isOpen, onClose, onSave, category, checkItems }: CategoryModalProps) {
  const [name, setName] = useState("")
  const [items, setItems] = useState<{ id?: string; name: string; sort_position: number }[]>([])

  useEffect(() => {
    if (category) {
      setName(category.name)
      setItems(checkItems.length > 0 ? [...checkItems].sort((a, b) => a.sort_position - b.sort_position) : [])
    } else {
      setName("")
      setItems([{ name: "", sort_position: 0 }])
    }
  }, [category, checkItems, isOpen])

  const handleAddItem = () => {
    setItems([...items, { name: "", sort_position: items.length }])
  }

  const handleRemoveItem = (index: number) => {
    const newItems = [...items]
    newItems.splice(index, 1)
    // Update sort positions
    newItems.forEach((item, idx) => {
      item.sort_position = idx
    })
    setItems(newItems)
  }

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...items]
    newItems[index].name = value
    setItems(newItems)
  }

  const handleSave = () => {
    if (!name.trim()) return

    // Filter out empty check items
    const validItems = items.filter((item) => item.name.trim() !== "")

    onSave({ id: category?.id, name }, validItems)
  }

  // Move item up or down in the list
  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= items.length) return

    const newItems = [...items]
    const [movedItem] = newItems.splice(fromIndex, 1)
    newItems.splice(toIndex, 0, movedItem)

    // Update sort positions
    newItems.forEach((item, idx) => {
      item.sort_position = idx
    })

    setItems(newItems)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? "カテゴリ編集" : "カテゴリ追加"}</DialogTitle>
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
                  <div className="cursor-move">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </div>

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
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button variant="outline" size="sm" className="w-full" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" />
                チェック項目を追加
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
