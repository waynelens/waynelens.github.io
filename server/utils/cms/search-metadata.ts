import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { CmsSearchMetadata } from '~~/shared/types/cms'

export type SearchMetadataFile = {
  path: string
  content: string
  entries: Record<string, CmsSearchMetadata>
}

const unescapeString = (value: string) => value.replace(/\\([\\'rn])/gu, (_match, character: string) => {
  if (character === 'r') return '\r'
  if (character === 'n') return '\n'
  return character
})

const parseStringArray = (source: string) => {
  const values: string[] = []
  const stringPattern = /'((?:\\.|[^'])*)'/gu
  let match = stringPattern.exec(source)

  while (match) {
    values.push(unescapeString(match[1] || ''))
    match = stringPattern.exec(source)
  }

  return values
}

const parseEntries = (content: string) => {
  const entries: Record<string, CmsSearchMetadata> = {}
  const entryPattern = /^  '((?:\\.|[^'])+)': \{\r?\n    en: ([\s\S]*?),\r?\n    'zh-TW': ([\s\S]*?)\r?\n  \}(?:,|$)/gmu
  let match = entryPattern.exec(content)

  while (match) {
    const key = unescapeString(match[1] || '')
    entries[key] = {
      en: parseStringArray(match[2] || ''),
      'zh-TW': parseStringArray(match[3] || '')
    }
    match = entryPattern.exec(content)
  }

  if (!Object.keys(entries).length && /export const searchMetadata/u.test(content)) {
    throw new Error('Unable to parse searchMetadata entries')
  }

  return entries
}

const quote = (value: string) => `'${value
  .replaceAll('\\', '\\\\')
  .replaceAll("'", "\\'")
  .replaceAll('\r', '\\r')
  .replaceAll('\n', '\\n')}'`

const renderList = (values: string[]) => {
  if (!values.length) return '[]'
  return `[\n${values.map(value => `      ${quote(value)}`).join(',\n')}\n    ]`
}

export const renderSearchMetadata = (entries: Record<string, CmsSearchMetadata>) => {
  const blocks = Object.entries(entries).map(([key, value]) => `  ${quote(key)}: {
    en: ${renderList(value.en)},
    'zh-TW': ${renderList(value['zh-TW'])}
  }`)

  return `import type { SearchLocale } from '~/utils/search'\n\n`
    + `type LocalizedSearchMetadata = Record<SearchLocale, string[]>\n\n`
    + `export const searchMetadata: Record<string, LocalizedSearchMetadata> = {\n`
    + `${blocks.join(',\n')}\n}\n`
}

export const readSearchMetadataFile = async (rootDirectory = process.cwd()): Promise<SearchMetadataFile> => {
  const path = resolve(rootDirectory, 'data/searchMetadata.ts')
  const content = await readFile(path, 'utf8')

  return {
    path,
    content,
    entries: parseEntries(content)
  }
}
