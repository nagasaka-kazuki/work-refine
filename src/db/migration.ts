import { readMigrationFiles } from 'drizzle-orm/migrator';
import { writeFileSync } from 'fs';
const migrations = readMigrationFiles({ migrationsFolder: './src/db/migrations' });
writeFileSync('./src/assets/migrations.json', JSON.stringify(migrations));