import { useStorageProvider } from '~~/server/utils/useStorageProvider'

// Admin endpoint to reject/delete a submission
export default eventHandler(async (event) => {
  const session = await requireUserSession(event)
  const submissionId = parseInt(getRouterParam(event, 'id') || '0')

  if (!submissionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid submission ID',
    })
  }

  try {
    const db = useDB()
    const { storageProvider } = useStorageProvider(event)

    // Get the submission
    const submission = await db
      .select()
      .from(tables.submissions)
      .where(eq(tables.submissions.id, submissionId))
      .get()

    if (!submission) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Submission not found',
      })
    }

    // Delete files from storage
    try {
      await storageProvider.delete(submission.storageKey)
      if (submission.thumbnailUrl) {
        const thumbnailKey = submission.storageKey.replace(/\.[^.]+$/, '_thumb.webp')
        await storageProvider.delete(thumbnailKey)
      }
    } catch (error) {
      logger.chrono.error('Failed to delete submission files from storage:', error)
    }

    // Delete from database
    await db
      .delete(tables.submissions)
      .where(eq(tables.submissions.id, submissionId))

    return {
      success: true,
      message: 'Submission deleted',
    }
  } catch (error) {
    logger.chrono.error('Failed to delete submission:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete submission',
    })
  }
})
