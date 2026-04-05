declare global {
  // eslint-disable-next-line no-var
  var __dbMigrationPromise: Promise<void> | undefined
  // eslint-disable-next-line no-var
  var __dbMigrated: boolean | undefined
}

export async function ensureDbMigrated(): Promise<void> {
  if (globalThis.__dbMigrated) {
    return
  }

  if (!globalThis.__dbMigrationPromise) {
    globalThis.__dbMigrationPromise = (async () => {
      await runTask('db:migrate')
      globalThis.__dbMigrated = true
    })().finally(() => {
      globalThis.__dbMigrationPromise = undefined
    })
  }

  await globalThis.__dbMigrationPromise
}
