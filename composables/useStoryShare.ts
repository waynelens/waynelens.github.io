type StoryShareInput = {
  title: string
  description?: string
  date?: string
  imageUrl: string
  path: string
  lang: 'en' | 'zh-TW'
}

type StoryShareResult = 'shared' | 'downloaded' | 'cancelled'

const CARD_WIDTH = 1080
const CARD_HEIGHT = 1350
const IMAGE_CACHE_VERSION = '20260714'
const FONT_STACK = '"Inter Variable", "Noto Sans TC Variable", sans-serif'

const loadImage = async (source: string) => {
  const imageUrl = new URL(source, window.location.origin)
  imageUrl.searchParams.set('v', IMAGE_CACHE_VERSION)

  const response = await fetch(imageUrl, { mode: 'cors' })

  if (!response.ok) {
    throw new Error(`Unable to load the article image (${response.status})`)
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

const roundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const corner = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + corner, y)
  context.arcTo(x + width, y, x + width, y + height, corner)
  context.arcTo(x + width, y + height, x, y + height, corner)
  context.arcTo(x, y + height, x, y, corner)
  context.arcTo(x, y, x + width, y, corner)
  context.closePath()
}

const drawCover = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const sourceWidth = width / scale
  const sourceHeight = height / scale
  const sourceX = (image.naturalWidth - sourceWidth) / 2
  const sourceY = (image.naturalHeight - sourceHeight) / 2

  context.save()
  roundedRect(context, x, y, width, height, 36)
  context.clip()
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height
  )
  context.restore()
}

const fitEllipsis = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) => {
  let fitted = text.trimEnd()
  while (fitted && context.measureText(`${fitted}…`).width > maxWidth) {
    fitted = fitted.slice(0, -1).trimEnd()
  }
  return `${fitted}…`
}

const wrapText = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
) => {
  const normalized = text.trim().replace(/\s+/g, ' ')
  const isCjk = /[\u3000-\u9fff]/.test(normalized)
  const tokens = isCjk ? Array.from(normalized) : normalized.split(' ')
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
  if (lines.length <= maxLines) return lines

  const visibleLines = lines.slice(0, maxLines)
  visibleLines[maxLines - 1] = fitEllipsis(context, visibleLines[maxLines - 1], maxWidth)
  return visibleLines
}

const canvasToFile = async (canvas: HTMLCanvasElement, filename: string) => {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      value => value ? resolve(value) : reject(new Error('Unable to encode the article card')),
      'image/jpeg',
      0.92
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
      throw new Error('Article cards can only be generated in a browser')
    }

    await document.fonts.ready

    const image = await loadImage(input.imageUrl)
    const canvas = document.createElement('canvas')
    canvas.width = CARD_WIDTH
    canvas.height = CARD_HEIGHT

    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas is unavailable')

    const background = context.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT)
    background.addColorStop(0, '#181817')
    background.addColorStop(1, '#080808')
    context.fillStyle = background
    context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

    drawCover(context, image, 60, 60, 960, 585)

    const imageShade = context.createLinearGradient(0, 60, 0, 645)
    imageShade.addColorStop(0, 'rgba(0, 0, 0, 0.28)')
    imageShade.addColorStop(0.38, 'rgba(0, 0, 0, 0)')
    imageShade.addColorStop(1, 'rgba(0, 0, 0, 0.48)')
    context.save()
    roundedRect(context, 60, 60, 960, 585, 36)
    context.clip()
    context.fillStyle = imageShade
    context.fillRect(60, 60, 960, 585)
    context.restore()

    context.fillStyle = '#ffffff'
    context.font = '400 46px "Playwrite Deutschland Schulausgangschrift", "Segoe Script", cursive'
    context.fillText('WJ', 96, 128)

    context.fillStyle = 'rgba(255, 255, 255, 0.82)'
    context.font = `600 23px ${FONT_STACK}`
    context.letterSpacing = '2px'
    context.fillText('PHOTOGRAPHY JOURNAL', 72, 710)
    context.textAlign = 'right'
    context.fillText(input.date || '', 1008, 710)
    context.textAlign = 'left'
    context.letterSpacing = '0px'

    context.fillStyle = '#ffffff'
    context.font = `700 58px ${FONT_STACK}`
    const titleLines = wrapText(context, input.title, 936, 3)
    const titleLineHeight = input.lang === 'zh-TW' ? 76 : 70
    const titleY = 790
    titleLines.forEach((line, index) => {
      context.fillText(line, 72, titleY + index * titleLineHeight)
    })

    const descriptionY = titleY + titleLines.length * titleLineHeight + 24
    if (input.description) {
      context.fillStyle = 'rgba(255, 255, 255, 0.68)'
      context.font = `400 31px ${FONT_STACK}`
      const descriptionLines = wrapText(context, input.description, 918, 3)
      const descriptionLineHeight = 46
      descriptionLines.forEach((line, index) => {
        context.fillText(line, 72, descriptionY + index * descriptionLineHeight)
      })
    }

    context.strokeStyle = 'rgba(255, 255, 255, 0.16)'
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(72, 1242)
    context.lineTo(1008, 1242)
    context.stroke()

    context.fillStyle = 'rgba(255, 255, 255, 0.78)'
    context.font = `600 25px ${FONT_STACK}`
    context.letterSpacing = '2px'
    context.fillText('WAYNELENS.DEV', 72, 1298)
    context.letterSpacing = '0px'

    const safeTitle = input.path
      .split('/')
      .filter(Boolean)
      .pop()
      ?.replace(/[^a-z0-9-]/gi, '-') || 'article'

    return canvasToFile(canvas, `${safeTitle}.${input.lang}.article-card.jpg`)
  }

  const shareStory = async (
    input: StoryShareInput,
    preparedFile?: File
  ): Promise<StoryShareResult> => {
    const file = preparedFile || await generateStoryFile(input)
    const url = new URL(input.path, window.location.origin).href

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: input.title, text: url })
        return 'shared'
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          downloadFile(file)
          await navigator.clipboard?.writeText(url).catch(() => undefined)
          return 'downloaded'
        }
        throw error
      }
    }

    downloadFile(file)
    await navigator.clipboard?.writeText(url).catch(() => undefined)
    return 'downloaded'
  }

  return { generateStoryFile, shareStory }
}
