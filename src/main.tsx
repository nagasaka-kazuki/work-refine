import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import migrations from './assets/migrations.json'
import { db } from './lib/db-client.ts'
import { categories, check_items, task_checks, tasks } from '@/db/schema.ts'
import { Home } from './app/page.tsx'

// https://github.com/drizzle-team/drizzle-orm/discussions/2532
await (db as any).dialect.migrate(migrations, (db as any).session, {
  migrationsTable: 'drizzle_migrations',
})

db.select()
  .from(categories)
  .then((data) => {
    console.log(data.map((item) => item.name))
  })

  console.log(db.select()
  .from(categories).toSQL())

      const [cats, tsks, chkItems, chkTs] = await Promise.all([
        db.select().from(categories),
        db.select().from(tasks),
        db.select().from(check_items),
        db.select().from(task_checks),
      ])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Home
      categoriesData={cats}
      tasksData={tsks}
      checkItemsData={chkItems}
      taskChecksData={chkTs}
    />
  </StrictMode>
)
