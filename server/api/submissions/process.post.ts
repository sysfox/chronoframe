import { useStorageProvider } from '~~/server/utils/useStorageProvider'
import sharp from 'sharp'
import { encode } from 'thumbhash'

// Process uploaded submission - no authentication required
export default eventHandler(async (event) => {
  const body = await readBody(event)
  const { fileKey, fileName, submitterName, submitterEmail, submitterMessage } = body

  if (!fileKey || !fileName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields',
    })
  }

  try {
    const db = useDB()
    const { storageProvider } = useStorageProvider(event)

    // Get the file from storage
    const fileBuffer = await storageProvider.read(fileKey)
    
    // Get image metadata using Sharp
    const metadata = await sharp(fileBuffer).metadata()
    
    // Generate thumbnail
    const thumbnailBuffer = await sharp(fileBuffer)
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()
    
    // Generate thumbhash
    const thumbhashImage = await sharp(fileBuffer)
      .resize(100, 100, { fit: 'inside' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    
    const thumbhashBytes = encode(
      thumbhashImage.info.width,
      thumbhashImage.info.height,
      thumbhashImage.data,
    )
    const thumbnailHash = Buffer.from(thumbhashBytes).toString('base64')
    
    // Upload thumbnail
    const thumbnailKey = fileKey.replace(/\.[^.]+$/, '_thumb.webp')
    await storageProvider.create(thumbnailKey, thumbnailBuffer, 'image/webp')
    
    // Get URLs
    const originalUrl = await storageProvider.getUrl(fileKey)
    const thumbnailUrl = await storageProvider.getUrl(thumbnailKey)
    
    // Save to database
    await db.insert(tables.submissions).values({
      storageKey: fileKey,
      originalUrl,
      thumbnailUrl,
      thumbnailHash,
      submitterName: submitterName || null,
      submitterEmail: submitterEmail || null,
      submitterMessage: submitterMessage || null,
      fileName,
      fileSize: fileBuffer.byteLength,
      width: metadata.width || null,
      height: metadata.height || null,
      status: 'pending',
    })

    return {
      success: true,
      message: 'Submission processed successfully',
    }
  } catch (error) {
    logger.chrono.error('Failed to process submission:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process submission',
    })
  }
})
