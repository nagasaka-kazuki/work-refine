import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, ChevronRight } from "lucide-react"
import { db } from "@/lib/db"
import { tasks, task_checks } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { cn } from "@/lib/utils"

interface TaskRowProps {
  task: any
  categoryName: string
  isExpanded: boolean
  onToggleExpand: () => void
  taskChecks: any[]
  getCheckItem: (id: string) => any
}

export function TaskRow({ task, categoryName, isExpanded, onToggleExpand, taskChecks, getCheckItem }: TaskRowProps) {
  const [status, setStatus] = useState(task.status)

  // Calculate if task is due soon or overdue
  const now = new Date()
  const dueDate = task.due_to ? new Date(task.due_to) : null
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const isDueSoon = dueDate && dueDate > now && dueDate < tomorrow && status !== "done"
  const isOverdue = dueDate && dueDate < now && status !== "done"

  // Format due date
  const formatDueDate = (date: Date) => {
    return new Intl.DateTimeFormat("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    try {
      await db
        .update(tasks)
        .set({
          status: newStatus,
          updated_at: new Date(),
        })
        .where(eq(tasks.id, task.id))

      setStatus(newStatus)
    } catch (error) {
      console.error("Error updating task status:", error)
    }
  }

  // Handle check item toggle
  const handleCheckToggle = async (taskCheckId: string, currentValue: boolean) => {
    try {
      await db
        .update(task_checks)
        .set({
          is_done: !currentValue,
          updated_at: new Date(),
        })
        .where(eq(task_checks.id, taskCheckId))
    } catch (error) {
      console.error("Error updating check item:", error)
    }
  }

  // Sort task checks by sort_position
  const sortedTaskChecks = [...taskChecks].sort((a, b) => a.sort_position - b.sort_position)

  return (
    <Card className="overflow-hidden">
      <div className="p-4 flex items-center cursor-pointer hover:bg-accent/50" onClick={onToggleExpand}>
        <div className="mr-2">
          {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </div>

        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">{task.name}</span>
            <Badge variant="outline" className="ml-2">
              {categoryName}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {dueDate && (
              <Badge variant={isOverdue ? "destructive" : isDueSoon ? "warning" : "outline"}>
                {formatDueDate(dueDate)}
              </Badge>
            )}

            <Badge
              variant={status === "done" ? "success" : status === "doing" ? "secondary" : "default"}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                const nextStatus = {
                  todo: "doing",
                  doing: "done",
                  done: "todo",
                }[status]
                handleStatusChange(nextStatus)
              }}
            >
              {status === "todo" ? "未着手" : status === "doing" ? "進行中" : "完了"}
            </Badge>
          </div>
        </div>
      </div>

      {isExpanded && (
        <CardContent className="pt-0 pb-4">
          {task.note && <div className="mb-4 text-sm text-muted-foreground">{task.note}</div>}

          <div className="space-y-2">
            <h4 className="text-sm font-medium mb-2">チェックリスト</h4>
            {sortedTaskChecks.length === 0 ? (
              <div className="text-sm text-muted-foreground">チェック項目がありません</div>
            ) : (
              sortedTaskChecks.map((taskCheck) => {
                const checkItem = getCheckItem(taskCheck.check_item_id)
                return checkItem ? (
                  <div key={taskCheck.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={taskCheck.is_done}
                      onCheckedChange={() => handleCheckToggle(taskCheck.id, taskCheck.is_done)}
                      id={`check-${taskCheck.id}`}
                    />
                    <label
                      htmlFor={`check-${taskCheck.id}`}
                      className={cn(
                        "text-sm cursor-pointer",
                        taskCheck.is_done && "line-through text-muted-foreground",
                      )}
                    >
                      {checkItem.name}
                    </label>
                  </div>
                ) : null
              })
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
