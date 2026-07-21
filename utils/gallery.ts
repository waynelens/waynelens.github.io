const TAIPEI_OFFSET_MS = 8 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

export type GalleryPhoto = {
  alt: string
  src: string
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
  photos: GalleryPhoto[],
  daySeed: string
): GalleryPhoto[] => {
  return photos
    .map(photo => ({
      ...photo,
      order: hashGalleryValue(`${daySeed}:order:${photo.src}`)
    }))
    .sort((a, b) => a.order - b.order || a.src.localeCompare(b.src))
    .map(({ order: _order, ...photo }) => photo)
}
