<script setup lang="ts">
const props = defineProps<{
  title: string
  imageUrl: string
  path: string
  lang: 'en' | 'zh-TW'
}>()

const { t } = useI18n()
const { shareStory } = useStoryShare()
const state = ref<'idle' | 'preparing' | 'downloaded' | 'error'>('idle')

const label = computed(() => {
  if (state.value === 'preparing') return t('share.preparing')
  if (state.value === 'downloaded') return t('share.downloaded')
  if (state.value === 'error') return t('share.failed')
  return t('share.button')
})

const handleShare = async () => {
  if (state.value === 'preparing') return
  state.value = 'preparing'

  try {
    const result = await shareStory(props)
    state.value = result === 'downloaded' ? 'downloaded' : 'idle'
  } catch (error) {
    console.error('Story share failed', error)
    state.value = 'error'
  }

  if (state.value !== 'idle') {
    setTimeout(() => {
      state.value = 'idle'
    }, 3500)
  }
}
</script>

<template>
  <button
    class="story-share-button"
    type="button"
    :disabled="state === 'preparing'"
    :aria-label="label"
    @click="handleShare"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M18 8a3 3 0 1 0-2.83-4A3 3 0 0 0 15 5c0 .18.02.35.05.52L8.91 8.59A3 3 0 0 0 7 8a3 3 0 1 0 1.91 5.31l6.14 3.07A3 3 0 0 0 15 17a3 3 0 1 0 .91-2.15l-6.14-3.07A3 3 0 0 0 10 11c0-.18-.02-.35-.05-.52l6.14-3.07A3 3 0 0 0 18 8" />
    </svg>
    <span>{{ label }}</span>
  </button>
</template>

<style scoped>
.story-share-button {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  width: fit-content;
  padding: 0.7rem 1rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  cursor: pointer;
  transition: transform 160ms ease, background 160ms ease;
}

.story-share-button:hover:not(:disabled) {
  transform: translateY(-1px);
  background: color-mix(in srgb, currentColor 8%, transparent);
}

.story-share-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.story-share-button svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.story-share-button span {
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
