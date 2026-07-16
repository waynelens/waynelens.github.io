const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

export type GalleryPhoto = {
  alt: string
  src: string
  wide: boolean
}

export const hashGalleryValue = (value: string) => {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

export const getTaipeiDaySeed = (timestamp = Date.now()) => {
  return String(Math.floor((timestamp + TAIPEI_OFFSET_MS) / DAY_MS))
}

export const arrangeDailyGallery = (
  photos: Omit<GalleryPhoto, 'wide'>[],
  daySeed: string
): GalleryPhoto[] => {
  const widePhotoCount = Math.max(1, Math.round(photos.length / 5))
  const widePhotoSources = new Set(
    [...photos]
      .sort((a, b) => (
        hashGalleryValue(`${daySeed}:size:${a.src}`)
        - hashGalleryValue(`${daySeed}:size:${b.src}`)
        || a.src.localeCompare(b.src)
      ))
      .slice(0, widePhotoCount)
      .map(photo => photo.src)
  )

  return photos
    .map(photo => ({
      ...photo,
      order: hashGalleryValue(`${daySeed}:order:${photo.src}`),
      wide: widePhotoSources.has(photo.src)
    }))
    .sort((a, b) => a.order - b.order || a.src.localeCompare(b.src))
    .map(({ order: _order, ...photo }) => photo)
}
