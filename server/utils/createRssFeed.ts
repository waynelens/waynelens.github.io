import { Feed } from 'feed'
import { queryCollection } from '@nuxt/content/server'
import type { H3Event } from 'h3'
import { getImageVariant } from '../../shared/utils/image'

type FeedLocale = 'en' | 'zh-TW'

const SITE_URL = 'https://waynelens.dev'

const localeConfig: Record<FeedLocale, {
  description: string
  language: string
  path: string
  title: string
}> = {
  en: {
    description: 'Photography stories, diving journeys, and visual notes by Wayne Jin.',
    language: 'en-US',
    path: '/rss/en.xml',
    title: 'Wayne Jin — Photography Stories'
  },
  'zh-TW': {
    description: 'Wayne Jin 的攝影故事、潛水旅程與影像紀錄。',
    language: 'zh-TW',
    path: '/rss/zh-tw.xml',
    title: 'Wayne Jin — 攝影故事'
  }
}

const toAbsoluteUrl = (value: string) => new URL(value, SITE_URL).toString()

export const createRssFeed = async (event: H3Event, locale: FeedLocale) => {
  const config = localeConfig[locale]
  const feedUrl = toAbsoluteUrl(config.path)
  const posts = await queryCollection(event, 'blog')
    .where('lang', '=', locale)
    .order('date', 'DESC')
    .all()

  const feed = new Feed({
    title: config.title,
    description: config.description,
    id: feedUrl,
    link: SITE_URL,
    language: config.language,
    favicon: toAbsoluteUrl('/favicon.svg'),
    copyright: `© ${new Date().getFullYear()} Wayne Jin`,
    generator: 'Nuxt',
    updated: posts[0] ? new Date(posts[0].date) : undefined,
    feedLinks: {
      rss: feedUrl
    },
    author: {
      name: 'Wayne Jin',
      link: SITE_URL
    }
  })

  for (const post of posts) {
    const link = toAbsoluteUrl(post.path)
    const publishedAt = new Date(post.date)

    feed.addItem({
      title: post.title,
      id: link,
      guid: link,
      link,
      description: post.description,
      date: publishedAt,
      published: publishedAt,
      image: post.cover ? getImageVariant(post.cover, 1200) : undefined,
      category: post.tags.map(name => ({ name })),
      author: [{
        name: 'Wayne Jin',
        link: SITE_URL
      }]
    })
  }

  return feed.rss2()
}
