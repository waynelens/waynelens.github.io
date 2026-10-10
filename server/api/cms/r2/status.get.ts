import { defineEventHandler } from 'h3'
import { inspectR2Connection } from '../../../utils/cms/r2'
import { assertLocalCmsRequest } from '../../../utils/cms/security'

export default defineEventHandler(async (event) => {
  assertLocalCmsRequest(event)
  return inspectR2Connection()
})
