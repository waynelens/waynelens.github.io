<script setup lang="ts">
type FeedLocale = 'en' | 'zh-TW'

const SITE_URL = 'https://waynelens.dev'
const { locale, t } = useI18n()
const { isRssOpen, closeRss } = useRssDialog()
const dialog = ref<HTMLDialogElement>()
const copiedLocale = ref<FeedLocale>()
const shareCopiedLocale = ref<FeedLocale>()
let copiedTimer: ReturnType<typeof setTimeout> | undefined

const feeds = computed(() => {
  const entries = [
    {
      locale: 'zh-TW' as const,
      label: t('rssDialog.traditionalChinese'),
      url: `${SITE_URL}/rss/zh-tw.xml`
    },
    {
      locale: 'en' as const,
      label: t('rssDialog.english'),
      url: `${SITE_URL}/rss/en.xml`
    }
  ]

  return entries.sort((first, second) => (
    Number(second.locale === locale.value) - Number(first.locale === locale.value)
  ))
})

const close = () => {
  closeRss()
  copiedLocale.value = undefined
  shareCopiedLocale.value = undefined
}

const markCopied = (feedLocale: FeedLocale, source: 'copy' | 'share') => {
  copiedLocale.value = source === 'copy' ? feedLocale : undefined
  shareCopiedLocale.value = source === 'share' ? feedLocale : undefined
  if (copiedTimer) clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => {
    copiedLocale.value = undefined
    shareCopiedLocale.value = undefined
  }, 2200)
}

const fallbackCopy = (value: string) => {
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  textarea.remove()
  return copied
}

const copyFeed = async (
  feedLocale: FeedLocale,
  url: string,
  source: 'copy' | 'share' = 'copy'
) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
    } else if (!fallbackCopy(url)) {
      throw new Error('Clipboard unavailable')
    }

    markCopied(feedLocale, source)
  } catch {
    if (fallbackCopy(url)) markCopied(feedLocale, source)
  }
}

const shareFeed = async (feedLocale: FeedLocale, label: string, url: string) => {
  if (!navigator.share) {
    await copyFeed(feedLocale, url, 'share')
    return
  }

  try {
    await navigator.share({
      title: `${t('rssDialog.shareTitle')} — ${label}`,
      text: t('rssDialog.shareText'),
      url
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    await copyFeed(feedLocale, url, 'share')
  }
}

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === dialog.value) close()
}

watch(isRssOpen, async (isOpen) => {
  await nextTick()

  if (isOpen) {
    if (!dialog.value?.open) dialog.value?.showModal()
    document.body.style.overflow = 'hidden'
    return
  }

  if (dialog.value?.open) dialog.value.close()
  document.body.style.overflow = ''
})

onBeforeUnmount(() => {
  if (copiedTimer) clearTimeout(copiedTimer)
  document.body.style.overflow = ''
})
</script>

<template>
  <dialog
    ref="dialog"
    class="rss-dialog"
    aria-labelledby="rss-dialog-title"
    @cancel.prevent="close"
    @click="handleBackdropClick"
  >
    <section class="rss-panel">
      <header class="rss-header">
        <div>
          <p class="eyebrow">RSS</p>
          <h2 id="rss-dialog-title">{{ $t('rssDialog.title') }}</h2>
        </div>
        <button type="button" class="rss-close" @click="close">
          {{ $t('common.close') }}
        </button>
      </header>

      <p class="rss-description">{{ $t('rssDialog.description') }}</p>

      <div class="rss-feeds">
        <article v-for="feed in feeds" :key="feed.locale" class="rss-feed-card">
          <div class="rss-feed-heading">
            <strong>{{ feed.label }}</strong>
            <span v-if="feed.locale === locale" class="rss-current">
              {{ $t('rssDialog.current') }}
            </span>
          </div>

          <code>{{ feed.url }}</code>

          <div class="rss-actions">
            <button type="button" @click="copyFeed(feed.locale, feed.url)">
              {{ copiedLocale === feed.locale ? $t('rssDialog.copied') : $t('rssDialog.copy') }}
            </button>
            <button
              type="button"
              @click="shareFeed(feed.locale, feed.label, feed.url)"
            >
              {{ shareCopiedLocale === feed.locale ? $t('rssDialog.shareCopied') : $t('rssDialog.share') }}
            </button>
            <a :href="feed.url" target="_blank" rel="noopener noreferrer">
              {{ $t('rssDialog.viewXml') }}
            </a>
          </div>
        </article>
      </div>
    </section>
  </dialog>
</template>

<style scoped>
.rss-dialog {
  width: min(620px, calc(100% - 28px));
  margin: max(9vh, 36px) auto auto;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--bg-elevated);
  color: var(--text);
  box-shadow: 0 32px 100px rgba(0, 0, 0, 0.46);
  backdrop-filter: blur(28px);
}

.rss-dialog::backdrop {
  background: rgba(0, 0, 0, 0.58);
  backdrop-filter: blur(8px);
}

.rss-panel {
  display: grid;
  gap: 18px;
  padding: clamp(20px, 4vw, 30px);
}

.rss-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 20px;
}

.rss-header .eyebrow {
  margin: 0 0 6px;
}

.rss-header h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.65rem, 4vw, 2.35rem);
  font-weight: 520;
  line-height: 1.1;
}

.rss-close,
.rss-actions button,
.rss-actions a {
  border: 1px solid var(--line);
  background: var(--bg-soft);
  color: var(--text);
  cursor: pointer;
  font: inherit;
  text-decoration: none;
}

.rss-close {
  padding: 0.5rem 0.7rem;
  border-radius: 9px;
  color: var(--muted);
  font-size: 0.74rem;
}

.rss-description {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
}

.rss-feeds {
  display: grid;
  gap: 12px;
}

.rss-feed-card {
  display: grid;
  gap: 13px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 17px;
  background: color-mix(in srgb, var(--bg-soft) 72%, transparent);
}

.rss-feed-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.rss-current {
  color: var(--muted);
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.rss-feed-card code {
  overflow-x: auto;
  padding: 11px 12px;
  border-radius: 10px;
  background: var(--bg);
  color: var(--muted);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  white-space: nowrap;
}

.rss-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rss-actions button,
.rss-actions a {
  padding: 0.62rem 0.82rem;
  border-radius: 999px;
  font-size: 0.78rem;
  transition: transform 160ms ease, background 160ms ease;
}

.rss-actions button:hover,
.rss-actions a:hover {
  transform: translateY(-1px);
  background: color-mix(in srgb, currentColor 9%, var(--bg-soft));
}

@media (max-width: 560px) {
  .rss-dialog {
    width: calc(100% - 16px);
    max-height: calc(100vh - 16px);
    margin: auto auto 8px;
    border-radius: 22px;
  }

  .rss-panel {
    max-height: calc(100vh - 16px);
    overflow-y: auto;
    padding: 20px 16px;
  }

  .rss-actions > * {
    flex: 1 1 auto;
    text-align: center;
  }
}
</style>
