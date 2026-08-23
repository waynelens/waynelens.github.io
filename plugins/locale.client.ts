import {
  SITE_LOCALE_STORAGE_KEY,
  getBlogRouteLocale,
  isSiteLocale,
  type SiteI18n
} from '~/shared/utils/locale'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', async () => {
    const i18n = nuxtApp.$i18n as SiteI18n
    const route = useRoute()
    const routeLocale = getBlogRouteLocale(route.path)

    if (routeLocale) {
      localStorage.setItem(SITE_LOCALE_STORAGE_KEY, routeLocale)
      return
    }

    const storedLocale = localStorage.getItem(SITE_LOCALE_STORAGE_KEY)
    if (isSiteLocale(storedLocale) && i18n.locale.value !== storedLocale) {
      await i18n.setLocale(storedLocale)
    }
  })
})
