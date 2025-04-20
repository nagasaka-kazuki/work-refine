"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TaskRow } from "@/components/task-row"

interface TaskListProps {
  tasks: any[]
  categories: any[]
  checkItems: any[]
  taskChecks: any[]
  sortBy: string
  getTaskStatus: (taskId: string) => "todo" | "doing" | "done"
}

export function TaskList({ tasks, categories, checkItems, taskChecks, sortBy, getTaskStatus }: TaskListProps) {
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({})

  const toggleTaskExpanded = (taskId: string) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }))
  }

  // Sort tasks based on sortBy
  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === "due_to") {
      if (!a.due_to) return 1
      if (!b.due_to) return -1
      return new Date(a.due_to).getTime() - new Date(b.due_to).getTime()
    } else if (sortBy === "status") {
      const statusOrder = { todo: 0, doing: 1, done: 2 }
      const statusA = getTaskStatus(a.id)
      const statusB = getTaskStatus(b.id)
      return statusOrder[statusA] - statusOrder[statusB]
    } else {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  // Get category name by id
  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.name : "不明"
  }

  // Get task checks for a task
  const getTaskChecks = (taskId: string) => {
    return taskChecks.filter((tc) => tc.task_id === taskId)
  }

  // Get check item details
  const getCheckItem = (checkItemId: string) => {
    return checkItems.find((ci) => ci.id === checkItemId)
  }

  return (
    <ScrollArea className="h-[calc(100vh-8rem)]">
      <div className="space-y-2">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            タスクがありません。新しいタスクを追加してください。
          </div>
        ) : (
          sortedTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              categoryName={getCategoryName(task.category_id)}
              isExpanded={!!expandedTasks[task.id]}
              onToggleExpand={() => toggleTaskExpanded(task.id)}
              taskChecks={getTaskChecks(task.id)}
              getCheckItem={getCheckItem}
            />
          ))
        )}
      </div>
    </ScrollArea>
  )
}
