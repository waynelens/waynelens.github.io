import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import type { CmsSavePayload } from '~~/shared/types/cms'
import { saveCmsArticleGroup } from '../../../utils/cms/articles'
import { assertLocalCmsRequest } from '../../../utils/cms/security'

export default defineEventHandler(async (event) => {
  assertLocalCmsRequest(event, true)
  const translationKey = getRouterParam(event, 'translationKey')
  if (!translationKey) throw createError({ statusCode: 400, statusMessage: 'Missing translationKey' })
  const payload = await readBody<CmsSavePayload>(event)
  return saveCmsArticleGroup(translationKey, payload)
})
