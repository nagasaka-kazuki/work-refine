import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import migrations from './assets/migrations.json'
import { db } from './lib/db-client.ts'
import { categories } from '@/db/schema.ts'

// https://github.com/drizzle-team/drizzle-orm/discussions/2532
await (db as any).dialect.migrate(migrations, (db as any).session, {
  migrationsTable: 'drizzle_migrations',
})

db.select()
  .from(categories)
  .then((data) => {
    console.log(data.map((item) => item.name))
  })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
