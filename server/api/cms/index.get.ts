import { defineEventHandler } from 'h3'
import { assertLocalCmsRequest } from '../../utils/cms/security'

export default defineEventHandler((event) => {
  assertLocalCmsRequest(event)

  return {
    ok: true,
    mode: 'local',
    integrations: {
      r2: 'available',
      github: 'planned'
    }
  }
})
