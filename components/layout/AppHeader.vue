<script setup lang="ts">
const route = useRoute()
const { locale, setLocale, t } = useI18n()
const theme = ref<'dark' | 'light'>('dark')
const switchingLocale = ref(false)
const { openSearch } = useSearchDialog()
const { openRss } = useRssDialog()

const applyTheme = (value: 'dark' | 'light') => {
  theme.value = value
  document.documentElement.dataset.theme = value
  localStorage.setItem('theme', value)
}

onMounted(() => {
  const stored = localStorage.getItem('theme')
  applyTheme(stored === 'light' ? 'light' : 'dark')
})

const toggleTheme = () => {
  applyTheme(theme.value === 'dark' ? 'light' : 'dark')
}

const targetLocale = computed(() => (locale.value === 'zh-TW' ? 'en' : 'zh-TW'))
const localeButtonText = computed(() => (targetLocale.value === 'en' ? 'EN' : '中'))
const localeLabel = computed(() => (
  targetLocale.value === 'en'
    ? t('header.switchToEnglish')
    : t('header.switchToTraditionalChinese')
))
const themeLabel = computed(() => (
  theme.value === 'dark' ? t('header.switchToLight') : t('header.switchToDark')
))

const switchLanguage = async () => {
  if (switchingLocale.value) return

  switchingLocale.value = true
  const nextLocale = targetLocale.value

  try {
    if (route.path.startsWith('/blog/')) {
      const currentPost = await queryCollection('blog').path(route.path).first()

      if (currentPost?.translationKey) {
        const translatedPost = await queryCollection('blog')
          .where('translationKey', '=', currentPost.translationKey)
          .where('lang', '=', nextLocale)
          .first()

        await setLocale(nextLocale)

        if (translatedPost?.path) {
          await navigateTo(translatedPost.path)
          return
        }
      }
    }

    await setLocale(nextLocale)
  } finally {
    switchingLocale.value = false
  }
}
const themeIconPath = computed(() => (
  theme.value === 'dark'
    ? 'M12 18a6 6 0 0 0 0-12a6 6 0 0 0 0 12m0-15a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0V4a1 1 0 0 1 1-1m0 18a1 1 0 0 1-1-1v-1a1 1 0 0 1 2 0v1a1 1 0 0 1-1 1m9-9a1 1 0 0 1-1 1h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 1 1M5 12a1 1 0 0 1-1 1H3a1 1 0 0 1 0-2h1a1 1 0 0 1 1 1m13.95 6.05a1 1 0 0 1-1.41 0l-.71-.71a1 1 0 0 1 1.41-1.41l.71.71a1 1 0 0 1 0 1.41M7.17 7.17a1 1 0 0 1-1.41 0l-.71-.71a1 1 0 0 1 1.41-1.41l.71.71a1 1 0 0 1 0 1.41m10.61-1.41a1 1 0 0 1 0 1.41l-.71.71a1 1 0 0 1-1.41-1.41l.71-.71a1 1 0 0 1 1.41 0M7.17 16.83a1 1 0 0 1 0 1.41l-.71.71a1 1 0 0 1-1.41-1.41l.71-.71a1 1 0 0 1 1.41 0'
    : 'M12 3a9 9 0 1 0 9 9c0-.48-.04-.94-.12-1.39A7.5 7.5 0 0 1 12.39 4.12A9 9 0 0 0 12 3m0 2a7 7 0 0 0 6.32 9.95A7 7 0 1 1 12 5'
))
const rssIconPath = 'M5 17a2 2 0 1 1 0 4a2 2 0 0 1 0-4m0-6a8 8 0 0 1 8 8h-2a6 6 0 0 0-6-6zm0-6a14 14 0 0 1 14 14h-2A12 12 0 0 0 5 7z'
const searchIconPath = 'm21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0a8 8 0 0 1 16 0Z'
</script>

<template>
  <header class="header-shell">
    <div class="header-backdrop">
      <NuxtLink to="/" class="brand" :aria-label="$t('header.home')">
        <span class="brand-mark">WJ</span>
      </NuxtLink>

      <div class="icon-group" :aria-label="$t('header.actions')">
        <button
          class="theme-button"
          type="button"
          :aria-label="$t('search.open')"
          :title="$t('search.open')"
          @click="openSearch"
        >
          <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path :d="searchIconPath" />
          </svg>
        </button>

        <button
          class="theme-button"
          type="button"
          :aria-label="$t('header.rss')"
          :title="$t('header.rss')"
          @click="openRss"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path :d="rssIconPath" />
          </svg>
        </button>

        <button
          class="theme-button language-button"
          type="button"
          :aria-label="localeLabel"
          :title="localeLabel"
          :disabled="switchingLocale"
          @click="switchLanguage"
        >
          <span>{{ localeButtonText }}</span>
        </button>

        <button
          class="theme-button"
          type="button"
          :aria-label="themeLabel"
          :title="themeLabel"
          @click="toggleTheme"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path :d="themeIconPath" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header-shell {
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  padding: 24px 32px 12px;
  background: color-mix(in srgb, var(--page-bg) 82%, transparent);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.header-backdrop {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

.brand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  color: var(--text);
  font-family: var(--font-brand);
  font-size: clamp(1.225rem, 1.96vw, 1.82rem);
  line-height: 1;
  letter-spacing: 0.01em;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  font-synthesis: none;
}

.icon-group {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  width: clamp(220px, 22vw, 280px);
  gap: 8px;
}

.theme-button {
  width: 100%;
  aspect-ratio: 1;
  display: inline-grid;
  place-items: center;
  padding: 0;
  border-radius: 999px;
  border: 0;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
}

.theme-button:hover {
  transform: translateY(-1px);
  background: color-mix(in srgb, currentColor 8%, transparent);
}

.theme-button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.language-button span {
  font-size: 0.78rem;
  font-weight: 650;
  letter-spacing: 0.06em;
}

.theme-button svg {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

.theme-button .search-icon {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
}

@media (max-width: 860px) {
  .header-shell {
    padding-inline: 24px;
  }
}

@media (max-width: 560px) {
  .header-shell {
    padding: 18px 18px 10px;
  }

  .icon-group {
    width: clamp(208px, 58vw, 248px);
    gap: 6px;
  }
}
</style>
