import { desc } from 'drizzle-orm'
import { settingsManager } from '~~/server/services/settings/settingsManager'

export default eventHandler(async (_event) => {
  const allowOriginalImage = await settingsManager.get<boolean>('app', 'allowOriginalImage')
  const photos = await useDB()
    .select()
    .from(tables.photos)
    .orderBy(desc(tables.photos.dateTaken))
    .all()

  if (allowOriginalImage === false) {
    return photos.map(({ originalUrl: _originalUrl, ...photo }) => photo)
  }

  return photos
})
