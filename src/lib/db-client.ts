import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { live } from '@electric-sql/pglite/live'

// https://pglite.dev/extensions/
export const pgClient = await PGlite.create('idb://work-refine', {
  extensions: { live },
})

export const db = drizzle(pgClient, { logger: true })
