import { readMigrationFiles } from 'drizzle-orm/migrator'
import { writeFileSync } from 'fs'
const migrations = readMigrationFiles({
  migrationsFolder: './src/db/migrations',
})
writeFileSync('./src/db/migration.json', JSON.stringify(migrations))
