import path from 'path'
import { useStorageProvider } from '~~/server/utils/useStorageProvider'
import { generateSafePhotoId } from '~~/server/utils/file-utils'

const IMAGE_EXTENSIONS = new Set([
  '.avif',
  '.bmp',
  '.gif',
  '.heic',
  '.heif',
  '.jpeg',
  '.jpg',
  '.png',
  '.tif',
  '.tiff',
  '.webp',
])

const isImageFile = (fileName: string, contentType?: string | null): boolean => {
  if (contentType?.toLowerCase().startsWith('image/')) {
    return true
  }

  const ext = path.extname(fileName).toLowerCase()
  return ext !== '' && IMAGE_EXTENSIONS.has(ext)
}

// Guest submission endpoint - no authentication required
export default eventHandler(async (event) => {
  const { storageProvider } = useStorageProvider(event)
  const t = await useTranslation(event)

  const body = await readBody(event)
  const { fileName, contentType, submitterName, submitterEmail, submitterMessage } = body

  if (!fileName) {
    throw createError({
      statusCode: 400,
      statusMessage: t('upload.error.required.title'),
    })
  }

  // Validate that it's an image file
  if (!isImageFile(fileName, contentType)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only image files are allowed',
    })
  }

  try {
    // Store submissions in a separate prefix
    const submissionPrefix = 'submissions/'
    const objectKey = `${submissionPrefix}${Date.now()}-${fileName}`

    // Generate signed URL for upload
    if (storageProvider.getSignedUrl) {
      const signedUrl = await storageProvider.getSignedUrl(objectKey, 3600, {
        contentType: contentType || 'application/octet-stream',
      })

      return {
        signedUrl,
        fileKey: objectKey,
        expiresIn: 3600,
        submitterName,
        submitterEmail,
        submitterMessage,
      }
    }

    // Fallback to internal upload endpoint
    const internalUploadUrl = `/api/submissions/upload?key=${encodeURIComponent(objectKey)}`
    return {
      signedUrl: internalUploadUrl,
      fileKey: objectKey,
      expiresIn: 3600,
      submitterName,
      submitterEmail,
      submitterMessage,
    }
  } catch (error) {
    logger.chrono.error('Failed to prepare submission upload:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to prepare upload',
    })
  }
})
