import 'dotenv/config'
import { defineConfig } from 'prisma/config'

const cliUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL

export default defineConfig({
  schema: 'prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js'
  },
  datasource: {
    // Prefer a direct DB URL for CLI operations (DIRECT_URL); fall back to DATABASE_URL if unset
    url: cliUrl,
  },
})
