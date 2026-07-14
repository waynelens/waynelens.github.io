import { createRssFeed } from '../../utils/createRssFeed'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  return createRssFeed(event, 'en')
})
