// components/task-check-editor.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2 } from 'lucide-react'
import { CheckItem } from '@/db/schema'

interface TaskOriginalCheckItemAreaProps {
  taskId: string
  checks: CheckItem[]
  onAdd: (taskId: string, name: string) => void
  onDelete: (checkItemId: string) => void
}

export function TaskOriginalCheckItemArea({
  taskId,
  checks,
  onAdd,
  onDelete,
}: TaskOriginalCheckItemAreaProps) {
  const [newName, setNewName] = useState('')

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    onAdd(taskId, name)
    setNewName('')
  }

  return (
    <div className="mt-4 border-t pt-4 space-y-2">
      {checks.length > 0 && (
        <div className="space-y-1">
          {checks.map((check) => (
            <div key={check.id} className="flex items-center justify-between">
              <span>{check.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(check.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="新規チェック項目を追加"
        />
        <Button onClick={handleAdd}>追加</Button>
      </div>
    </div>
  )
}
