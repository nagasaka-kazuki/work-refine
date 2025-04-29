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

const MIGRATION_HASH_KEY = "drizzle_migration_hash";

// 最新のマイグレーションハッシュを取得
function getLatestMigrationHash() {
  if (!Array.isArray(migrations) || migrations.length === 0) {
    return null;
  }
  return migrations[migrations.length - 1].hash;
}

// ローカルストレージのハッシュと比較して、マイグレーションが必要かどうか
function isMigrationNeeded(): boolean {
  const latest = getLatestMigrationHash();
  const saved =
    typeof window !== "undefined"
      ? window.localStorage.getItem(MIGRATION_HASH_KEY)
      : null;
  return latest !== null && latest !== saved;
}

// マイグレーション実行＆ハッシュ保存
async function runMigrationIfNeeded(dbInstance: any) {
  const latest = getLatestMigrationHash();
  if (!latest) return;

  if (!isMigrationNeeded()) {
    console.log("[migrate] skip, hash matches:", latest);
    return;
  }

  console.log("[migrate] running migrations…");
  await dbInstance.dialect.migrate(migrations, (dbInstance as any).session, {
    migrationsTable: "drizzle_migrations",
  });

  // 成功したらローカルストレージに最新ハッシュを保存
  window.localStorage.setItem(MIGRATION_HASH_KEY, latest);
  console.log("[migrate] done, saved hash:", latest);
}


async function initAndRender() {
  // 必要ならマイグレーション実行
  console.time("migration");
  await runMigrationIfNeeded(db);
  console.timeEnd("migration");

  // データ取得
  const [cats, tsks, chkItems, chkTs] = await Promise.all([
    db.select().from(categories),
    db.select().from(tasks),
    db.select().from(check_items),
    db.select().from(task_checks),
  ]) as [Category[], Task[], CheckItem[], TaskCheck[]];

  // レンダリング
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
  );
}

initAndRender()