<script setup lang="ts">
const theme = ref<'dark' | 'light'>('dark')

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

const themeLabel = computed(() => (theme.value === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'))
const rssLabel = 'RSS feed'
const instagramLabel = 'Instagram profile'
const themeIconPath = computed(() => (
  theme.value === 'dark'
    ? 'M12 18a6 6 0 0 0 0-12a6 6 0 0 0 0 12m0-15a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0V4a1 1 0 0 1 1-1m0 18a1 1 0 0 1-1-1v-1a1 1 0 0 1 2 0v1a1 1 0 0 1-1 1m9-9a1 1 0 0 1-1 1h-1a1 1 0 0 1 0-2h1a1 1 0 0 1 1 1M5 12a1 1 0 0 1-1 1H3a1 1 0 0 1 0-2h1a1 1 0 0 1 1 1m13.95 6.05a1 1 0 0 1-1.41 0l-.71-.71a1 1 0 0 1 1.41-1.41l.71.71a1 1 0 0 1 0 1.41M7.17 7.17a1 1 0 0 1-1.41 0l-.71-.71a1 1 0 0 1 1.41-1.41l.71.71a1 1 0 0 1 0 1.41m10.61-1.41a1 1 0 0 1 0 1.41l-.71.71a1 1 0 0 1-1.41-1.41l.71-.71a1 1 0 0 1 1.41 0M7.17 16.83a1 1 0 0 1 0 1.41l-.71.71a1 1 0 0 1-1.41-1.41l.71-.71a1 1 0 0 1 1.41 0'
    : 'M12 3a9 9 0 1 0 9 9c0-.48-.04-.94-.12-1.39A7.5 7.5 0 0 1 12.39 4.12A9 9 0 0 0 12 3m0 2a7 7 0 0 0 6.32 9.95A7 7 0 1 1 12 5'
))
const rssIconPath = 'M5 17a2 2 0 1 1 0 4a2 2 0 0 1 0-4m0-6a8 8 0 0 1 8 8h-2a6 6 0 0 0-6-6zm0-6a14 14 0 0 1 14 14h-2A12 12 0 0 0 5 7z'
const instagramIconPath = 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4m0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm5 2.5A4.5 4.5 0 1 1 7.5 12A4.5 4.5 0 0 1 12 7.5m0 2A2.5 2.5 0 1 0 14.5 12A2.5 2.5 0 0 0 12 9.5M17.75 6.5a1.25 1.25 0 1 1-1.25 1.25A1.25 1.25 0 0 1 17.75 6.5'
</script>

<template>
  <header class="header-shell">
    <div class="header-backdrop">
      <NuxtLink to="/" class="brand" aria-label="Home">
        <span class="brand-mark">WJ</span>
      </NuxtLink>

      <div class="icon-group" aria-label="Social and theme actions">
        <button
          class="theme-button"
          type="button"
          :aria-label="rssLabel"
          :title="rssLabel"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path :d="rssIconPath" />
          </svg>
        </button>

        <button
          class="theme-button"
          type="button"
          :aria-label="instagramLabel"
          :title="instagramLabel"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path :d="instagramIconPath" />
          </svg>
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
  width: 100%;
  padding: 24px 32px 0;
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
  grid-template-columns: repeat(3, 1fr);
  width: clamp(180px, 18vw, 222px);
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

.theme-button svg {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

@media (max-width: 860px) {
  .header-shell {
    padding-inline: 24px;
  }
}

@media (max-width: 560px) {
  .header-shell {
    padding: 18px 18px 0;
  }

  .icon-group {
    width: clamp(164px, 46vw, 204px);
    gap: 6px;
  }
}
</style>
