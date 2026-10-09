import { defineEventHandler } from 'h3'
import { listCmsArticleGroups } from '../../../utils/cms/articles'
import { assertLocalCmsRequest } from '../../../utils/cms/security'

export default defineEventHandler(async (event) => {
  assertLocalCmsRequest(event)
  return listCmsArticleGroups()
})
