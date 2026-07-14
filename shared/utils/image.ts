export const IMAGE_WIDTHS = [480, 768, 1200] as const
export type ImageWidth = typeof IMAGE_WIDTHS[number]

export const DEFAULT_IMAGE_QUALITY = 82

const IMAGE_SOURCE_ORIGIN = 'https://media.waynelens.dev'
const IMAGE_TRANSFORM_ORIGIN = 'https://waynelens.dev'
const SUPPORTED_IMAGE_PATH = /\.(?:avif|gif|jpe?g|png|webp)$/i

export const isTransformableImage = (source: string) => {
  try {
    const url = new URL(source)
    return url.origin === IMAGE_SOURCE_ORIGIN && SUPPORTED_IMAGE_PATH.test(url.pathname)
  } catch {
    return false
  }
}

export const getImageVariant = (
  source: string,
  width: ImageWidth,
  quality = DEFAULT_IMAGE_QUALITY
) => {
  if (!isTransformableImage(source)) return source

  const options = [
    `width=${width}`,
    'fit=scale-down',
    `quality=${quality}`,
    'format=auto',
    'onerror=redirect'
  ].join(',')

  return `${IMAGE_TRANSFORM_ORIGIN}/cdn-cgi/image/${options}/${source}`
}

export const getImageSrcset = (
  source: string,
  widths: readonly ImageWidth[] = IMAGE_WIDTHS,
  quality = DEFAULT_IMAGE_QUALITY
) => {
  if (!isTransformableImage(source)) return ''

  return widths
    .map(width => `${getImageVariant(source, width, quality)} ${width}w`)
    .join(', ')
}
