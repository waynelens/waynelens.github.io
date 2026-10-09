import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getCmsArticleGroup } from '../../../utils/cms/articles'
import { assertLocalCmsRequest } from '../../../utils/cms/security'

export default defineEventHandler(async (event) => {
  assertLocalCmsRequest(event)
  const translationKey = getRouterParam(event, 'translationKey')
  if (!translationKey) throw createError({ statusCode: 400, statusMessage: 'Missing translationKey' })
  return getCmsArticleGroup(translationKey)
})
