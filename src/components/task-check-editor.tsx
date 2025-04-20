// components/task-check-editor.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2 } from 'lucide-react'
import { CheckItem, TaskCheck } from '@/db/schema'
import { CheckItemRepository } from '@/lib/repositories/checkItems'
import { CheckItemArea } from './check-item'

interface TaskOriginalCheckItemAreaProps {
  taskId: string
  checks: CheckItem[]
  taskChecks: TaskCheck[]
}

export function TaskOriginalCheckItemArea({
  taskId,
  checks,
  taskChecks,
}: TaskOriginalCheckItemAreaProps) {
  const [newName, setNewName] = useState('')

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    CheckItemRepository.createForTask(taskId, name)
    setNewName('')
  }

  return (
    <div className="mt-4 border-t pt-4 space-y-2">
      {checks.length > 0 && (
        <div className="space-y-1">
          {checks.map((check) => (
            <div key={check.id} className="flex items-center justify-between">
              <CheckItemArea
                ci={check}
                tc={taskChecks.find((tc) => tc.check_item_id === check.id)!}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  CheckItemRepository.deleteById(check.id)
                }}
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
