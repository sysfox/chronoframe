export default defineNitroPlugin(async (_nitroApp) => {
  try {
    await runTask('db:migrate')
  } catch (error) {
    console.error('Database migration failed:', error)
    process.exit(1)
  }
  // await runTask('db:seed')
})
