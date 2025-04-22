import { useState, useEffect, useRef } from 'react'
import { pgClient } from '@/lib/db-client'
import { db } from '@/lib/db-client'
import {
  categories,
  tasks,
  check_items,
  task_checks,
  Category,
  Task,
  CheckItem,
  TaskCheck,
} from '@/db/schema'

export function useLiveSync(
  initialCategories: Category[],
  initialTasks: Task[],
  initialCheckItems: CheckItem[],
  initialTaskChecks: TaskCheck[]
) {
  const [allCategories, setAllCategories] =
    useState<Category[]>(initialCategories)
  const [allTasks, setAllTasks] = useState<Task[]>(initialTasks)
  const [allCheckItems, setAllCheckItems] =
    useState<CheckItem[]>(initialCheckItems)
  const [allTaskChecks, setAllTaskChecks] =
    useState<TaskCheck[]>(initialTaskChecks)
  const subsRef = useRef<Array<() => Promise<void>>>([])

  useEffect(() => {
    const setup = async () => {
      if (subsRef.current.length > 0) {
        await Promise.all(subsRef.current.map((unsub) => unsub()))
      }

      // ライブクエリ登録
      const [catLive, taskLive, itemLive, checkLive] = await Promise.all([
        pgClient.live.query(
          db.select().from(categories).toSQL().sql,
          [],
          (res) => {
            setAllCategories((res as any).rows ?? res)
          }
        ),
        pgClient.live.query(db.select().from(tasks).toSQL().sql, [], (res) => {
          setAllTasks((res as any).rows ?? res)
        }),
        pgClient.live.query(
          db.select().from(check_items).toSQL().sql,
          [],
          (res) => {
            setAllCheckItems((res as any).rows ?? res)
          }
        ),
        pgClient.live.query(
          db.select().from(task_checks).toSQL().sql,
          [],
          (res) => {
            setAllTaskChecks((res as any).rows ?? res)
          }
        ),
      ])

      // 解除関数を保管
      subsRef.current = [
        catLive.unsubscribe,
        taskLive.unsubscribe,
        itemLive.unsubscribe,
        checkLive.unsubscribe,
      ]
    }

    setup()

    return () => {
      subsRef.current.forEach((unsub) => unsub())
      subsRef.current = []
    }
  }, [])

  return { allCategories, allTasks, allCheckItems, allTaskChecks }
}
