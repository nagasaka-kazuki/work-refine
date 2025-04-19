import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { live } from '@electric-sql/pglite/live'

// https://pglite.dev/extensions/
export const client = new PGlite('idb://work-refine', { extensions: { live } })

export const db = drizzle(client, { logger: true })
