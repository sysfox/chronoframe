import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { join } from 'path'

export default defineTask({
  meta: {
    name: 'db:migrate',
    description: 'Migrate the database',
  },
  async run() {
    const log = logger.dynamic('db')
    const db = useDB()

    log.info('Migrating database...')

    migrate(db, {
      migrationsFolder: join(process.cwd(), 'server/database/migrations'),
    })

    log.success('Database migrated successfully.')

    return {
      result: 'success',
    }
  },
})
