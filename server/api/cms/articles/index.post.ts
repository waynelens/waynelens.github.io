import { defineEventHandler, readBody } from 'h3'
import type { CmsCreatePayload } from '~~/shared/types/cms'
import { createCmsArticleGroup } from '../../../utils/cms/articles'
import { assertLocalCmsRequest } from '../../../utils/cms/security'

export default defineEventHandler(async (event) => {
  assertLocalCmsRequest(event, true)
  const payload = await readBody<CmsCreatePayload>(event)
  return createCmsArticleGroup(payload)
})
