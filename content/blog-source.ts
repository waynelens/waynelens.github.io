import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { defineCollectionSource } from '@nuxt/content'

export const BLOG_STATUSES = ['draft', 'published', 'hidden'] as const

export type BlogStatus = typeof BLOG_STATUSES[number]

export type BlogSourceEntry = {
  absolutePath: string
  content: string
  key: string
  route: string
  status: BlogStatus
}

const frontmatterPattern = /^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u
const statusPattern = /^status:\s*([^#\r\n]+?)(?:\s+#.*)?$/imu

const collectMarkdownFiles = (directory: string): string[] => {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name)

    if (entry.isDirectory()) return collectMarkdownFiles(entryPath)
    return entry.isFile() && entry.name.endsWith('.md') ? [entryPath] : []
  })
}

export const getBlogStatus = (content: string, filePath = 'blog article'): BlogStatus => {
  const frontmatter = content.match(frontmatterPattern)?.[1] || ''
  const rawStatus = frontmatter.match(statusPattern)?.[1]?.trim().replace(/^['"]|['"]$/g, '')

  if (!rawStatus) return 'draft'
  if (BLOG_STATUSES.includes(rawStatus as BlogStatus)) return rawStatus as BlogStatus

  throw new Error(
    `Invalid blog status "${rawStatus}" in ${filePath}. Expected draft, published, or hidden.`
  )
}

export const getBlogSourceEntries = (rootDirectory = process.cwd()): BlogSourceEntry[] => {
  const blogDirectory = resolve(rootDirectory, 'content/blog')

  return collectMarkdownFiles(blogDirectory).map((absolutePath) => {
    const content = readFileSync(absolutePath, 'utf8')
    const key = relative(blogDirectory, absolutePath).split(sep).join('/')

    return {
      absolutePath,
      content,
      key,
      route: `/blog/${key.replace(/\.md$/u, '').toLowerCase()}`,
      status: getBlogStatus(content, absolutePath)
    }
  })
}

let contentDirectory = resolve('content')

export const blogSource = defineCollectionSource({
  async prepare({ rootDir }) {
    contentDirectory = join(rootDir, 'content')
    blogSource.cwd = contentDirectory
  },
  async getKeys() {
    return getBlogSourceEntries(resolve(contentDirectory, '..'))
      .filter(entry => entry.status !== 'draft')
      .map(entry => entry.key)
  },
  async getItem(key) {
    return readFileSync(join(contentDirectory, 'blog', key), 'utf8')
  }
})

blogSource.cwd = contentDirectory
blogSource.include = 'blog/**/*.md'
blogSource.prefix = '/blog'
