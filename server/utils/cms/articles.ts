import { createHash, randomUUID } from 'node:crypto'
import {
  access,
  mkdir,
  readFile,
  readdir,
  rename,
  stat,
  unlink,
  writeFile
} from 'node:fs/promises'
import { basename, dirname, resolve, sep } from 'node:path'
import { createError } from 'h3'
import { parseDocument, stringify } from 'yaml'
import { z } from 'zod'
import type {
  CmsArticleDocument,
  CmsArticleFrontmatter,
  CmsArticleGroup,
  CmsArticleGroupSummary,
  CmsArticleSaveInput,
  CmsCreatePayload,
  CmsLocale,
  CmsMutationResult,
  CmsSavePayload,
  CmsSearchMetadata,
  CmsValidationIssue
} from '~~/shared/types/cms'
import { readSearchMetadataFile, renderSearchMetadata } from './search-metadata'

const ARTICLE_DIRECTORIES: Record<CmsLocale, string> = {
  'zh-TW': 'content/blog/zh-TW',
  en: 'content/blog/en'
}

const frontmatterPattern = /^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u
const fileNamePattern = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u
const translationKeyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u

const frontmatterSchema = z.object({
  lang: z.enum(['zh-TW', 'en']),
  translationKey: z.string().regex(translationKeyPattern),
  status: z.enum(['draft', 'published', 'hidden']),
  title: z.string(),
  description: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u),
  tags: z.array(z.string()).default([]),
  cover: z.string().optional(),
  carouselImages: z.array(z.string()).default([]),
  articleGalleryImages: z.array(z.string()).default([]),
  siteGalleryImages: z.array(z.string()).default([])
})

const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u),
  slug: z.string().regex(slugPattern),
  translationKey: z.string().regex(translationKeyPattern),
  locales: z.array(z.enum(['zh-TW', 'en'])).min(1)
})

const saveSchema = z.object({
  articles: z.array(z.object({
    locale: z.enum(['zh-TW', 'en']),
    fileName: z.string().regex(fileNamePattern),
    revision: z.string().length(64),
    frontmatter: frontmatterSchema,
    body: z.string()
  })).min(1),
  searchMetadata: z.object({
    en: z.array(z.string()),
    'zh-TW': z.array(z.string())
  }),
  searchMetadataRevision: z.string().length(64)
})

type FileChange = {
  path: string
  content: string
  expectedRevision: string | null
}

const parseInput = <Schema extends z.ZodType>(schema: Schema, input: unknown): z.infer<Schema> => {
  const result = schema.safeParse(input)
  if (result.success) return result.data

  throw createError({
    statusCode: 400,
    message: result.error.issues
      .map(issue => `${issue.path.join('.') || 'request'}: ${issue.message}`)
      .join('；')
  })
}

const hash = (content: string) => createHash('sha256').update(content).digest('hex')

const exists = async (path: string) => {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

const articlePath = (rootDirectory: string, locale: CmsLocale, fileName: string) => {
  if (!fileNamePattern.test(fileName) || basename(fileName) !== fileName) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid article filename' })
  }

  const directory = resolve(rootDirectory, ARTICLE_DIRECTORIES[locale])
  const path = resolve(directory, fileName)
  if (!path.startsWith(`${directory}${sep}`)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid article path' })
  }

  return path
}

const normalizeList = (values: string[]) => [...new Set(values.map(value => value.trim()).filter(Boolean))]

const parseMarkdown = (
  content: string,
  locale: CmsLocale,
  fileName: string,
  modifiedAt: string
): CmsArticleDocument => {
  const match = content.match(frontmatterPattern)
  if (!match) throw new Error(`Missing frontmatter in ${fileName}`)

  const document = parseDocument(match[1]!)
  if (document.errors.length) {
    throw new Error(`Invalid YAML in ${fileName}: ${document.errors[0]?.message}`)
  }

  const parsed = frontmatterSchema.parse(document.toJS())
  if (parsed.lang !== locale) {
    throw new Error(`Language mismatch in ${fileName}`)
  }

  return {
    locale,
    fileName,
    path: `/blog/${locale}/${fileName.replace(/\.md$/u, '')}`,
    revision: hash(content),
    modifiedAt,
    frontmatter: parsed,
    body: content.slice(match[0].length)
  }
}

const readArticle = async (rootDirectory: string, locale: CmsLocale, fileName: string) => {
  const path = articlePath(rootDirectory, locale, fileName)
  const [content, details] = await Promise.all([readFile(path, 'utf8'), stat(path)])
  return parseMarkdown(content, locale, fileName, details.mtime.toISOString())
}

const updateMarkdown = (currentContent: string, article: CmsArticleSaveInput) => {
  const match = currentContent.match(frontmatterPattern)
  if (!match) throw createError({ statusCode: 400, statusMessage: `Missing frontmatter in ${article.fileName}` })

  const document = parseDocument(match[1]!)
  if (document.errors.length) {
    throw createError({ statusCode: 400, statusMessage: `Invalid YAML in ${article.fileName}` })
  }

  const fields: Array<keyof CmsArticleFrontmatter> = [
    'lang',
    'translationKey',
    'status',
    'title',
    'description',
    'date',
    'tags',
    'cover',
    'carouselImages',
    'articleGalleryImages',
    'siteGalleryImages'
  ]

  for (const field of fields) {
    const value = article.frontmatter[field]
    if (field === 'cover' && !value) document.delete(field)
    else document.set(field, value)
  }

  const yaml = document.toString({ lineWidth: 0 }).trimEnd()
  const body = article.body.startsWith('\n') ? article.body : `\n${article.body}`
  return `---\n${yaml}\n---\n${body}`
}

const writeFilesAtomically = async (changes: FileChange[]) => {
  const prepared: Array<FileChange & { temp: string, backup: string, hadOriginal: boolean, backedUp: boolean }> = []

  for (const change of changes) {
    const hadOriginal = await exists(change.path)
    if (change.expectedRevision === null && hadOriginal) {
      throw createError({ statusCode: 409, statusMessage: `${basename(change.path)} already exists` })
    }

    if (change.expectedRevision !== null) {
      if (!hadOriginal) {
        throw createError({ statusCode: 409, statusMessage: `${basename(change.path)} was removed outside the CMS` })
      }

      const current = await readFile(change.path, 'utf8')
      if (hash(current) !== change.expectedRevision) {
        throw createError({
          statusCode: 409,
          statusMessage: `${basename(change.path)} changed outside the CMS; reload before saving`
        })
      }
    }

    await mkdir(dirname(change.path), { recursive: true })
    const suffix = `.cms-${randomUUID()}`
    const item = {
      ...change,
      temp: `${change.path}${suffix}.tmp`,
      backup: `${change.path}${suffix}.bak`,
      hadOriginal,
      backedUp: false
    }
    await writeFile(item.temp, change.content, 'utf8')
    prepared.push(item)
  }

  try {
    for (const item of prepared) {
      if (item.hadOriginal) {
        await rename(item.path, item.backup)
        item.backedUp = true
      }
      await rename(item.temp, item.path)
    }

    await Promise.all(prepared.map(async (item) => {
      if (item.backedUp && await exists(item.backup)) await unlink(item.backup)
    }))
  } catch (error) {
    for (const item of [...prepared].reverse()) {
      if (await exists(item.path)) await unlink(item.path).catch(() => undefined)
      if (item.backedUp && await exists(item.backup)) {
        await rename(item.backup, item.path).catch(() => undefined)
      }
      if (await exists(item.temp)) await unlink(item.temp).catch(() => undefined)
    }
    throw error
  }
}

const collectArticleIssues = (
  article: Pick<CmsArticleDocument, 'locale' | 'frontmatter' | 'body'>,
  metadata?: CmsSearchMetadata
): CmsValidationIssue[] => {
  const issues: CmsValidationIssue[] = []
  const { frontmatter } = article

  if (!frontmatter.title.trim()) issues.push({ level: 'error', field: 'title', message: '標題不可空白' })
  if (!frontmatter.description.trim()) issues.push({ level: 'error', field: 'description', message: 'Description 不可空白' })
  if (!article.body.trim()) issues.push({ level: 'warning', field: 'body', message: '正文目前是空白的' })
  if (!frontmatter.cover) issues.push({ level: 'warning', field: 'cover', message: '尚未設定封面圖片' })

  const imageFields = ['carouselImages', 'articleGalleryImages', 'siteGalleryImages'] as const
  for (const field of imageFields) {
    const images = frontmatter[field]
    if (new Set(images).size !== images.length) {
      issues.push({ level: 'warning', field, message: `${field} 含有重複 URL` })
    }
    if (images.some(url => !url.startsWith('https://media.waynelens.dev/'))) {
      issues.push({ level: 'warning', field, message: `${field} 含有非 media.waynelens.dev URL` })
    }
  }

  if (frontmatter.status === 'published' && metadata) {
    if (!metadata.en.length || !metadata['zh-TW'].length) {
      issues.push({ level: 'warning', field: 'searchMetadata', message: '公開文章應具備中英文搜尋詞' })
    }
  }

  return issues
}

const readLocaleArticles = async (rootDirectory: string, locale: CmsLocale) => {
  const directory = resolve(rootDirectory, ARTICLE_DIRECTORIES[locale])
  const entries = await readdir(directory, { withFileTypes: true })
  return Promise.all(entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(entry => readArticle(rootDirectory, locale, entry.name)))
}

export const listCmsArticleGroups = async (rootDirectory = process.cwd()): Promise<CmsArticleGroupSummary[]> => {
  const articles = (await Promise.all([
    readLocaleArticles(rootDirectory, 'zh-TW'),
    readLocaleArticles(rootDirectory, 'en')
  ])).flat()
  const groups = new Map<string, CmsArticleGroupSummary>()

  for (const article of articles) {
    const key = article.frontmatter.translationKey
    const group = groups.get(key) || {
      translationKey: key,
      locales: {},
      warnings: [],
      modifiedAt: article.modifiedAt
    }

    group.locales[article.locale] = {
      locale: article.locale,
      fileName: article.fileName,
      path: article.path,
      status: article.frontmatter.status,
      title: article.frontmatter.title,
      date: article.frontmatter.date,
      modifiedAt: article.modifiedAt
    }
    if (article.modifiedAt > group.modifiedAt) group.modifiedAt = article.modifiedAt
    groups.set(key, group)
  }

  for (const group of groups.values()) {
    if (!group.locales['zh-TW']) group.warnings.push('缺少中文版')
    if (!group.locales.en) group.warnings.push('缺少英文版')
  }

  return [...groups.values()].sort((a, b) => {
    const aDate = a.locales['zh-TW']?.date || a.locales.en?.date || ''
    const bDate = b.locales['zh-TW']?.date || b.locales.en?.date || ''
    return bDate.localeCompare(aDate) || b.modifiedAt.localeCompare(a.modifiedAt)
  })
}

export const getCmsArticleGroup = async (
  translationKey: string,
  rootDirectory = process.cwd()
): Promise<CmsArticleGroup> => {
  if (!translationKeyPattern.test(translationKey)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid translationKey' })
  }

  const allArticles = (await Promise.all([
    readLocaleArticles(rootDirectory, 'zh-TW'),
    readLocaleArticles(rootDirectory, 'en')
  ])).flat()
  const matching = allArticles.filter(article => article.frontmatter.translationKey === translationKey)

  if (!matching.length) throw createError({ statusCode: 404, statusMessage: 'Article not found' })

  const metadataFile = await readSearchMetadataFile(rootDirectory)
  const metadata = metadataFile.entries[translationKey] || { en: [], 'zh-TW': [] }
  const articles: CmsArticleGroup['articles'] = {}
  const warnings: string[] = []

  for (const article of matching) {
    articles[article.locale] = article
    warnings.push(...collectArticleIssues(article, metadata).map(issue => `${article.locale}: ${issue.message}`))
  }
  if (!articles['zh-TW']) warnings.push('缺少中文版')
  if (!articles.en) warnings.push('缺少英文版')

  return {
    translationKey,
    articles,
    searchMetadata: metadata,
    searchMetadataRevision: hash(metadataFile.content),
    warnings
  }
}

export const createCmsArticleGroup = async (
  input: CmsCreatePayload,
  rootDirectory = process.cwd()
): Promise<CmsMutationResult> => {
  const payload = parseInput(createSchema, input)
  const locales = [...new Set(payload.locales)]
  const metadataFile = await readSearchMetadataFile(rootDirectory)
  const changes: FileChange[] = []

  for (const locale of locales) {
    const fileName = `${payload.date}-${payload.slug}.md`
    const path = articlePath(rootDirectory, locale, fileName)
    const frontmatter: CmsArticleFrontmatter = {
      lang: locale,
      translationKey: payload.translationKey,
      status: 'draft',
      title: locale === 'zh-TW' ? '未命名草稿' : 'Untitled Draft',
      description: locale === 'zh-TW' ? '請填寫文章簡介。' : 'Add an article description.',
      date: payload.date,
      tags: [],
      carouselImages: [],
      articleGalleryImages: [],
      siteGalleryImages: []
    }
    const body = locale === 'zh-TW' ? '在這裡撰寫文章正文。' : 'Write the article here.'
    changes.push({
      path,
      expectedRevision: null,
      content: `---\n${stringify(frontmatter, { lineWidth: 0 }).trimEnd()}\n---\n\n${body}\n`
    })
  }

  const existingMetadata = metadataFile.entries[payload.translationKey]
  metadataFile.entries[payload.translationKey] = existingMetadata || {
    en: [payload.date],
    'zh-TW': [payload.date, `${payload.date.slice(0, 4)}年${Number(payload.date.slice(5, 7))}月${Number(payload.date.slice(8, 10))}日`]
  }
  changes.push({
    path: metadataFile.path,
    content: renderSearchMetadata(metadataFile.entries),
    expectedRevision: hash(metadataFile.content)
  })

  await writeFilesAtomically(changes)
  return { ok: true, translationKey: payload.translationKey, warnings: [] }
}

export const saveCmsArticleGroup = async (
  translationKey: string,
  input: CmsSavePayload,
  rootDirectory = process.cwd()
): Promise<CmsMutationResult> => {
  if (!translationKeyPattern.test(translationKey)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid translationKey' })
  }

  const payload = parseInput(saveSchema, input)
  const metadata: CmsSearchMetadata = {
    en: normalizeList(payload.searchMetadata.en),
    'zh-TW': normalizeList(payload.searchMetadata['zh-TW'])
  }
  const changes: FileChange[] = []
  const warnings: string[] = []

  for (const article of payload.articles) {
    if (article.frontmatter.translationKey !== translationKey || article.frontmatter.lang !== article.locale) {
      throw createError({ statusCode: 400, statusMessage: 'Article language or translationKey mismatch' })
    }

    const parsed = frontmatterSchema.parse(article.frontmatter)
    const normalized: CmsArticleSaveInput = {
      ...article,
      frontmatter: {
        ...parsed,
        title: parsed.title.trim(),
        description: parsed.description.trim(),
        tags: normalizeList(parsed.tags),
        carouselImages: normalizeList(parsed.carouselImages),
        articleGalleryImages: normalizeList(parsed.articleGalleryImages),
        siteGalleryImages: normalizeList(parsed.siteGalleryImages)
      }
    }
    const issues = collectArticleIssues(normalized, metadata)
    const errors = issues.filter(issue => issue.level === 'error')
    if (errors.length) {
      throw createError({ statusCode: 400, statusMessage: errors.map(issue => issue.message).join('；') })
    }
    warnings.push(...issues.filter(issue => issue.level === 'warning').map(issue => `${article.locale}: ${issue.message}`))

    const path = articlePath(rootDirectory, article.locale, article.fileName)
    const currentContent = await readFile(path, 'utf8')
    changes.push({
      path,
      content: updateMarkdown(currentContent, normalized),
      expectedRevision: article.revision
    })
  }

  const metadataFile = await readSearchMetadataFile(rootDirectory)
  metadataFile.entries[translationKey] = metadata
  changes.push({
    path: metadataFile.path,
    content: renderSearchMetadata(metadataFile.entries),
    expectedRevision: payload.searchMetadataRevision
  })

  await writeFilesAtomically(changes)
  return { ok: true, translationKey, warnings }
}
