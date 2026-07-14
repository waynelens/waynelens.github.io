export type SearchLocale = 'en' | 'zh-TW'

const segmenters: Record<SearchLocale, Intl.Segmenter> = {
  en: new Intl.Segmenter('en', { granularity: 'word' }),
  'zh-TW': new Intl.Segmenter('zh-Hant', { granularity: 'word' })
}

const normalizeSearchText = (text: string, locale: SearchLocale) => {
  return text
    .normalize('NFKC')
    .toLocaleLowerCase(locale === 'zh-TW' ? 'zh-Hant' : 'en-US')
}

const createCjkBigrams = (text: string) => {
  const runs = text.match(/\p{Script=Han}+/gu) || []

  return runs.flatMap((run) => {
    const characters = Array.from(run)
    if (characters.length === 1) return characters

    return characters.slice(0, -1).map((character, index) => {
      return `${character}${characters[index + 1]}`
    })
  })
}

export const tokenizeSearchText = (text: string, locale: SearchLocale) => {
  const normalized = normalizeSearchText(text, locale)
  const words = Array.from(segmenters[locale].segment(normalized))
    .filter(segment => segment.isWordLike)
    .map(segment => segment.segment)

  const tokens = locale === 'zh-TW'
    ? [...words, ...createCjkBigrams(normalized)]
    : words

  return [...new Set(tokens)]
}

export const extractContentText = (node: unknown): string => {
  if (typeof node === 'string') {
    return node
  }

  if (Array.isArray(node)) {
    const contentStartIndex = typeof node[0] === 'string' ? 2 : 0

    return node
      .slice(contentStartIndex)
      .map(extractContentText)
      .filter(Boolean)
      .join(' ')
  }

  if (!node || typeof node !== 'object') return ''

  const contentNode = node as {
    type?: string
    value?: unknown
    children?: unknown
  }

  if (contentNode.type === 'text' && typeof contentNode.value === 'string') {
    return contentNode.value
  }

  return extractContentText(contentNode.children ?? contentNode.value)
}
