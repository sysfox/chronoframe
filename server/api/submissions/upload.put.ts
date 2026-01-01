import { useStorageProvider } from '~~/server/utils/useStorageProvider'
import { logger } from '~~/server/utils/logger'

// Internal upload endpoint for submissions - no authentication required
export default eventHandler(async (event) => {
  const { storageProvider } = useStorageProvider(event)
  const key = getQuery(event).key as string | undefined
  const t = await useTranslation(event)

  if (!key) {
    throw createError({
      statusCode: 400,
      statusMessage: t('upload.error.required.title'),
      data: {
        title: t('upload.error.required.title'),
        message: t('upload.error.required.message', { field: 'key' }),
      },
    })
  }

  // Ensure the key is in the submissions prefix
  if (!key.startsWith('submissions/')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid upload path',
    })
  }

  const contentType = getHeader(event, 'content-type') || 'application/octet-stream'
  
  const raw = await readRawBody(event, false)
  if (!raw || !(raw instanceof Buffer)) {
    throw createError({
      statusCode: 400,
      statusMessage: t('upload.error.uploadFailed.title'),
      data: {
        title: t('upload.error.uploadFailed.title'),
        message: t('upload.error.uploadFailed.message'),
      },
    })
  }
  
  // Size limit for submissions (50MB)
  const maxBytes = 50 * 1024 * 1024
  if (raw.byteLength > maxBytes) {
    const sizeInMB = (raw.byteLength / 1024 / 1024).toFixed(2)
    throw createError({
      statusCode: 413,
      statusMessage: t('upload.error.tooLarge.title'),
      data: {
        title: t('upload.error.tooLarge.title'),
        message: t('upload.error.tooLarge.message', { size: sizeInMB }),
        suggestion: t('upload.error.tooLarge.suggestion', { maxSize: 50 }),
      },
    })
  }

  try {
    await storageProvider.create(key.replace(/^\/+/, ''), raw, contentType)
  } catch (error) {
    logger.chrono.error('Storage provider create error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: t('upload.error.uploadFailed.title'),
      data: {
        title: t('upload.error.uploadFailed.title'),
        message: t('upload.error.uploadFailed.message'),
      },
    })
  }

  return { ok: true, key }
})
