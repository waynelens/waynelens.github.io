export const SITE_LOCALE_STORAGE_KEY = 'waynelens-locale'

export type SiteLocale = 'en' | 'zh-TW'

export type SiteI18n = {
  locale: { value: string }
  setLocale: (locale: SiteLocale) => Promise<void>
}

export const isSiteLocale = (value: unknown): value is SiteLocale => {
  return value === 'en' || value === 'zh-TW'
}

export const getBlogRouteLocale = (path: string): SiteLocale | undefined => {
  const localeSegment = path.split('/')[2]?.toLowerCase()

  if (localeSegment === 'en') return 'en'
  if (localeSegment === 'zh-tw') return 'zh-TW'
  return undefined
}
