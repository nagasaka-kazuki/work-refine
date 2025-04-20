'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PlusCircle } from 'lucide-react'

interface TopBarProps {
  onAddTask: () => void
  sortBy: string
  onSortChange: (value: any) => void
}

export function TopBar({ onAddTask, sortBy, onSortChange }: TopBarProps) {
  return (
    <div className="border-b bg-background p-4 flex items-center justify-between">
      <h1 className="text-xl font-bold">タスク管理</h1>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">並び替え:</span>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="並び替え" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="due_to">期日</SelectItem>
              <SelectItem value="status">ステータス</SelectItem>
              <SelectItem value="created_at">作成日</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={onAddTask}>
          <PlusCircle className="mr-2 h-4 w-4" />
          タスク追加
        </Button>
      </div>
    </div>
  )
}
