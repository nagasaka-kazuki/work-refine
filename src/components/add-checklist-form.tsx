import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type AddChecklistItemFormProps = {
  onAdd: (title: string) => void
}

export function AddChecklistItemForm({ onAdd }: AddChecklistItemFormProps) {
  const [title, setTitle] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onAdd(title)
      setTitle('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-4">
      <Input
        placeholder="新しいアイテムを追加"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" size="sm">
        追加
      </Button>
    </form>
  )
}
