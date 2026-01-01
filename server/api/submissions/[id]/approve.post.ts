import { generateSafePhotoId } from '~~/server/utils/file-utils'
import { eq } from 'drizzle-orm'

// Admin endpoint to approve a submission and convert it to a photo
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

    if (submission.status !== 'pending') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Submission has already been reviewed',
      })
    }

    // Generate photo ID
    const photoId = generateSafePhotoId(submission.storageKey)

    // Create photo record
    await db.insert(tables.photos).values({
      id: photoId,
      storageKey: submission.storageKey,
      originalUrl: submission.originalUrl,
      thumbnailUrl: submission.thumbnailUrl,
      thumbnailHash: submission.thumbnailHash,
      width: submission.width,
      height: submission.height,
      fileSize: submission.fileSize,
      aspectRatio: submission.width && submission.height 
        ? submission.width / submission.height 
        : null,
      title: submission.fileName,
      description: submission.submitterMessage || null,
    })

    // Update submission status
    await db
      .update(tables.submissions)
      .set({
        status: 'approved',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        photoId,
      })
      .where(eq(tables.submissions.id, submissionId))

    return {
      success: true,
      message: 'Submission approved',
      photoId,
    }
  } catch (error) {
    logger.chrono.error('Failed to approve submission:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to approve submission',
    })
  }
})
