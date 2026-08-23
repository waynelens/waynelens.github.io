import { getBlogRouteLocale, type SiteI18n } from '~/shared/utils/locale'

export default defineNuxtRouteMiddleware(async (to) => {
  const routeLocale = getBlogRouteLocale(to.path)
  if (!routeLocale) return

  const i18n = useNuxtApp().$i18n as SiteI18n
  if (i18n.locale.value !== routeLocale) {
    await i18n.setLocale(routeLocale)
  }
})
