import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import migrations from './db/migration.json'
import { db } from './lib/db-client.ts'
import {
  categories,
  Category,
  check_items,
  CheckItem,
  Task,
  task_checks,
  TaskCheck,
  tasks,
} from '@/db/schema.ts'
import Home from './app/page.tsx'
import { Toaster } from 'sonner'

const root = createRoot(document.getElementById('root')!)

// トップレベル await を使わず、then チェーンで migrate → データ取得 → レンダリング
;(db as any).dialect
  .migrate(migrations, (db as any).session, {
    migrationsTable: 'drizzle_migrations',
  })
  .then(() =>
    Promise.all([
      db.select().from(categories),
      db.select().from(tasks),
      db.select().from(check_items),
      db.select().from(task_checks),
    ])
  )
  .then(
    ([cats, tsks, chkItems, chkTs]: [
      Category[],
      Task[],
      CheckItem[],
      TaskCheck[],
    ]) => {
      root.render(
        <StrictMode>
          <Home
            categoriesData={cats}
            tasksData={tsks}
            checkItemsData={chkItems}
            taskChecksData={chkTs}
          />
          <Toaster />
        </StrictMode>
      )
    }
  )
