import { ensureDbMigrated } from '../utils/ensure-db-migrated'

export default defineNitroPlugin(async (_nitroApp) => {
  try {
    await ensureDbMigrated()
  } catch (error) {
    console.error('Database migration failed:', error)
    process.exit(1)
  }
  // await runTask('db:seed')
})
