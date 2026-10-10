import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import type { CmsCreateLocalePayload } from '~~/shared/types/cms'
import { createCmsArticleLocale } from '../../../../utils/cms/articles'
import { assertLocalCmsRequest } from '../../../../utils/cms/security'

export default defineEventHandler(async (event) => {
  assertLocalCmsRequest(event, true)
  const translationKey = getRouterParam(event, 'translationKey')
  if (!translationKey) throw createError({ statusCode: 400, message: 'Missing translationKey' })
  const payload = await readBody<CmsCreateLocalePayload>(event)
  return createCmsArticleLocale(translationKey, payload)
})
