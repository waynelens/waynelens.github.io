type StoryShareInput = {
  title: string
  imageUrl: string
  path: string
  lang: 'en' | 'zh-TW'
}

type StoryShareResult = 'shared' | 'downloaded' | 'cancelled'

const STORY_WIDTH = 1080
const STORY_HEIGHT = 1920
const STORY_IMAGE_CACHE_VERSION = '20260713'

const loadImage = async (source: string) => {
  const imageUrl = new URL(source, window.location.origin)
  imageUrl.searchParams.set('v', STORY_IMAGE_CACHE_VERSION)

  const response = await fetch(imageUrl, { mode: 'cors' })

  if (!response.ok) {
    throw new Error(`Unable to load the story image (${response.status})`)
  }

  const objectUrl = URL.createObjectURL(await response.blob())

  try {
    const image = new Image()
    image.decoding = 'async'
    image.src = objectUrl
    await image.decode()
    return image
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

const drawCover = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement
) => {
  const scale = Math.max(
    STORY_WIDTH / image.naturalWidth,
    STORY_HEIGHT / image.naturalHeight
  )
  const sourceWidth = STORY_WIDTH / scale
  const sourceHeight = STORY_HEIGHT / scale
  const sourceX = (image.naturalWidth - sourceWidth) / 2
  const sourceY = (image.naturalHeight - sourceHeight) / 2

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    STORY_WIDTH,
    STORY_HEIGHT
  )
}

const wrapText = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) => {
  const isCjk = /[\u3000-\u9fff]/.test(text)
  const tokens = isCjk ? Array.from(text) : text.split(/\s+/)
  const separator = isCjk ? '' : ' '
  const lines: string[] = []
  let currentLine = ''

  for (const token of tokens) {
    const candidate = currentLine ? `${currentLine}${separator}${token}` : token

    if (context.measureText(candidate).width <= maxWidth || !currentLine) {
      currentLine = candidate
      continue
    }

    lines.push(currentLine)
    currentLine = token
  }

  if (currentLine) lines.push(currentLine)
  return lines.slice(0, 4)
}

const canvasToFile = async (canvas: HTMLCanvasElement, filename: string) => {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      value => value ? resolve(value) : reject(new Error('Unable to encode the story image')),
      'image/jpeg',
      0.9
    )
  })

  return new File([blob], filename, { type: 'image/jpeg' })
}

const downloadFile = (file: File) => {
  const objectUrl = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = file.name
  link.click()
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

export const useStoryShare = () => {
  const generateStoryFile = async (input: StoryShareInput) => {
    if (!import.meta.client) {
      throw new Error('Story images can only be generated in a browser')
    }

    await document.fonts.ready

    const image = await loadImage(input.imageUrl)
    const canvas = document.createElement('canvas')
    canvas.width = STORY_WIDTH
    canvas.height = STORY_HEIGHT

    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas is unavailable')

    drawCover(context, image)

    const overlay = context.createLinearGradient(0, 520, 0, STORY_HEIGHT)
    overlay.addColorStop(0, 'rgba(0, 0, 0, 0.02)')
    overlay.addColorStop(0.58, 'rgba(0, 0, 0, 0.24)')
    overlay.addColorStop(1, 'rgba(0, 0, 0, 0.9)')
    context.fillStyle = overlay
    context.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT)

    context.fillStyle = '#ffffff'
    context.font = '400 46px "Playwrite Deutschland Schulausgangschrift", "Segoe Script", cursive'
    context.fillText('WJ', 76, 116)

    context.font = '600 72px "Inter Variable", "Noto Sans TC Variable", sans-serif'

    const lines = wrapText(context, input.title, 920)
    const lineHeight = input.lang === 'zh-TW' ? 96 : 92
    const titleY = 1570 - Math.max(0, lines.length - 1) * lineHeight

    lines.forEach((line, index) => {
      context.fillText(line, 76, titleY + index * lineHeight)
    })

    context.fillStyle = 'rgba(255, 255, 255, 0.78)'
    context.font = '500 30px "Inter Variable", "Noto Sans TC Variable", sans-serif'
    context.fillText('WAYNELENS.DEV', 76, 1818)

    const safeTitle = input.path
      .split('/')
      .filter(Boolean)
      .pop()
      ?.replace(/[^a-z0-9-]/gi, '-') || 'story'

    return canvasToFile(canvas, `${safeTitle}.${input.lang}.jpg`)
  }

  const shareStory = async (input: StoryShareInput): Promise<StoryShareResult> => {
    const file = await generateStoryFile(input)
    const url = new URL(input.path, window.location.origin).href

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: input.title, text: url })
        return 'shared'
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
        throw error
      }
    }

    downloadFile(file)
    await navigator.clipboard?.writeText(url).catch(() => undefined)
    return 'downloaded'
  }

  return { generateStoryFile, shareStory }
}
