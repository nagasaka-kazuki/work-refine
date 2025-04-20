'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { CheckItem, Task, TaskCheck } from '@/db/schema'
import { TaskOriginalCheckItemArea } from './task-check-editor'
import { CheckItemArea } from './check-item'

interface TaskRowProps {
  task: Task
  categoryName: string
  isExpanded: boolean
  onToggleExpand: () => void
  taskChecks: TaskCheck[]
  getCheckItem: (id: string) => CheckItem | undefined
}

export function TaskRow({
  task,
  categoryName,
  isExpanded,
  onToggleExpand,
  taskChecks,
  getCheckItem,
}: TaskRowProps) {
  // 1. ソート済みチェック全体
  const sortedTaskChecks: TaskCheck[] = [...taskChecks].sort(
    (a, b) => a.sort_position - b.sort_position
  )

  // 2. 共通 vs オリジナルを分割
  const [categoryTaskChecks, originalTaskChecks] = (() => {
    const cat: TaskCheck[] = []
    const orig: TaskCheck[] = []
    for (const tc of sortedTaskChecks) {
      const ci = getCheckItem(tc.check_item_id)
      if (ci?.task_id) orig.push(tc)
      else cat.push(tc)
    }
    return [cat, orig] as const
  })()

  const originalCheckItems: CheckItem[] = originalTaskChecks
    .map((tc) => getCheckItem(tc.check_item_id))
    .filter((ci): ci is CheckItem => !!ci)

  // 3. ステータス計算
  const calculateStatus = useCallback(() => {
    if (sortedTaskChecks.length === 0) return 'todo'
    const doneCount = sortedTaskChecks.filter((c) => c.is_done).length
    if (doneCount === 0) return 'todo'
    if (doneCount === sortedTaskChecks.length) return 'done'
    return 'doing'
  }, [sortedTaskChecks])

  const [status, setStatus] = useState<'todo' | 'doing' | 'done'>(
    calculateStatus()
  )
  useEffect(() => {
    setStatus(calculateStatus())
  }, [calculateStatus])

  // 4. 期日バッジ
  const now = new Date()
  const dueDate = task.due_to ? new Date(task.due_to) : null
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isDueSoon =
    dueDate && dueDate > now && dueDate < tomorrow && status !== 'done'
  const isOverdue = dueDate && dueDate < now && status !== 'done'

  const formatDueDate = (d: Date) =>
    new Intl.DateTimeFormat('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)

  return (
    <Card className="overflow-hidden">
      {/* ヘッダー */}
      <div
        className="p-4 flex items-center cursor-pointer hover:bg-accent/50"
        onClick={onToggleExpand}
      >
        <div className="mr-2">
          {isExpanded ? <ChevronDown /> : <ChevronRight />}
        </div>
        <div className="flex-1 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-medium">{task.name}</span>
            <Badge variant="default">{categoryName}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {dueDate && (
              <Badge
                variant={
                  isOverdue ? 'destructive' : isDueSoon ? 'warning' : 'default'
                }
              >
                {formatDueDate(dueDate)}
              </Badge>
            )}
            <Badge
              variant={
                status === 'done'
                  ? 'success'
                  : status === 'doing'
                    ? 'secondary'
                    : 'default'
              }
            >
              {status === 'todo'
                ? '未着手'
                : status === 'doing'
                  ? '進行中'
                  : '完了'}
            </Badge>
          </div>
        </div>
      </div>

      {/* ボディ */}
      {isExpanded && (
        <CardContent className="pt-0 pb-4">
          {task.note && (
            <div className="mb-4 text-sm text-muted-foreground">
              {task.note}
            </div>
          )}

          {/* カテゴリ共通チェック */}
          <div className="space-y-2">
            {categoryTaskChecks.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                チェック項目がありません
              </div>
            ) : (
              categoryTaskChecks.map((tc) => {
                const ci = getCheckItem(tc.check_item_id)
                return ci ? <CheckItemArea key={tc.id} tc={tc} ci={ci} /> : null
              })
            )}
          </div>

          {/* タスク専用チェック編集UI */}
          <TaskOriginalCheckItemArea
            taskId={task.id}
            checks={originalCheckItems}
            taskChecks={originalTaskChecks}
          />
        </CardContent>
      )}
    </Card>
  )
}
