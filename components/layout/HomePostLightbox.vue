<script setup lang="ts">
const props = defineProps<{
  open: boolean
  post: {
    path: string
    title?: string
    description?: string
    date?: string
    tags?: string[]
    body?: unknown
  }
}>()

const emit = defineEmits<{
  close: []
}>()

const dialog = ref<HTMLDialogElement>()
const closeButton = ref<HTMLButtonElement>()
const titleId = useId()
let previousBodyOverflow = ''

const close = () => emit('close')

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === dialog.value) close()
}

const syncDialogState = async (isOpen: boolean) => {
  if (!import.meta.client) return
  await nextTick()

  if (isOpen) {
    if (!dialog.value?.open) {
      previousBodyOverflow = document.body.style.overflow
      dialog.value?.showModal()
    }
    document.body.style.overflow = 'hidden'
    closeButton.value?.focus()
    return
  }

  if (dialog.value?.open) dialog.value.close()
  document.body.style.overflow = previousBodyOverflow
}

watch(() => props.open, syncDialogState)

onMounted(() => {
  void syncDialogState(props.open)
})

onBeforeUnmount(() => {
  document.body.style.overflow = previousBodyOverflow
})
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="home-post-lightbox"
      :aria-labelledby="titleId"
      @cancel.prevent="close"
      @click="handleBackdropClick"
      @keydown.esc.prevent="close"
    >
        <article class="home-post-lightbox-panel glass-panel">
          <button ref="closeButton" class="home-post-lightbox-close" type="button" @click="close">
            {{ $t('common.close') }}
          </button>

          <header class="home-post-lightbox-head">
            <p class="eyebrow">{{ $t('post.preview') }}</p>
            <h2 :id="titleId" class="section-title">{{ props.post.title }}</h2>
            <p v-if="props.post.description" class="home-post-lightbox-description">
              {{ props.post.description }}
            </p>

            <div class="home-post-lightbox-meta">
              <span class="chip">{{ props.post.date || $t('common.unpublished') }}</span>
              <span
                v-for="tag in props.post.tags || []"
                :key="tag"
                class="chip"
              >
                {{ tag }}
              </span>
            </div>
          </header>

          <div class="home-post-lightbox-content">
            <ContentRenderer v-if="props.post.body" :value="props.post" />
          </div>

          <NuxtLink :to="props.post.path" class="home-post-lightbox-link">
            {{ $t('post.openFull') }}
          </NuxtLink>
        </article>
    </dialog>
  </Teleport>
</template>

<style scoped>
.home-post-lightbox {
  width: 100vw;
  max-width: none;
  height: 100dvh;
  max-height: none;
  margin: 0;
  border: 0;
  color: var(--text);
  background: transparent;
  place-items: center;
  padding: 18px;
}

.home-post-lightbox[open] {
  display: grid;
}

.home-post-lightbox::backdrop {
  background: rgba(5, 7, 10, 0.82);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.home-post-lightbox-panel {
  position: relative;
  width: min(100%, 1100px);
  max-height: min(90vh, 1100px);
  padding: clamp(20px, 3vw, 32px);
  border-radius: var(--radius-xl);
  display: grid;
  gap: 18px;
  overflow: auto;
}

.home-post-lightbox-close {
  position: sticky;
  top: 0;
  justify-self: end;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--bg);
  color: var(--text);
  padding: 0.7rem 0.95rem;
  cursor: pointer;
}

.home-post-lightbox-head {
  display: grid;
  gap: 12px;
}

.home-post-lightbox-head h2 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.4rem);
  line-height: 1;
}

.home-post-lightbox-description {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
  max-width: 65ch;
}

.home-post-lightbox-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.home-post-lightbox-content {
  line-height: 1.8;
}

.home-post-lightbox-content :deep(h2),
.home-post-lightbox-content :deep(h3) {
  font-family: var(--font-display);
  line-height: 1.08;
}

.home-post-lightbox-content :deep(h2) {
  margin-top: 2rem;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
}

.home-post-lightbox-content :deep(p),
.home-post-lightbox-content :deep(li) {
  color: var(--text);
}

.home-post-lightbox-content :deep(img) {
  width: 100%;
  height: auto;
  border-radius: 18px;
  margin: 1.4rem 0;
}

.home-post-lightbox-link {
  justify-self: start;
  color: var(--text);
  font-size: 0.86rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.home-post-lightbox-link::after {
  content: "";
  display: block;
  width: 100%;
  height: 1px;
  margin-top: 5px;
  background: currentColor;
}

@media (max-width: 700px) {
  .home-post-lightbox {
    padding: 10px;
  }

  .home-post-lightbox-panel {
    max-height: 94vh;
  }
}
</style>
