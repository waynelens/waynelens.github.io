import { createError, getHeader, getRequestHost, type H3Event } from 'h3'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

const normalizeHost = (value: string) => {
  if (value.startsWith('[')) return value.slice(1, value.indexOf(']'))
  return value.split(':')[0]?.toLowerCase() || ''
}

export const assertLocalCmsRequest = (event: H3Event, mutation = false) => {
  if (process.env.NODE_ENV !== 'development') {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const host = normalizeHost(getRequestHost(event, { xForwardedHost: false }))
  if (!LOCAL_HOSTS.has(host)) {
    throw createError({ statusCode: 403, statusMessage: 'CMS is available on localhost only' })
  }

  if (!mutation) return

  const origin = getHeader(event, 'origin')
  if (!origin) return

  try {
    if (!LOCAL_HOSTS.has(new URL(origin).hostname.toLowerCase())) {
      throw new Error('Non-local origin')
    }
  } catch {
    throw createError({ statusCode: 403, statusMessage: 'Invalid CMS request origin' })
  }
}
