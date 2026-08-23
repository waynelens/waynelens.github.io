<script setup lang="ts">
const { t } = useI18n()
const props = defineProps<{
  open: boolean
  src: string
  index: number
}>()

const emit = defineEmits<{
  close: []
}>()

const dialog = ref<HTMLDialogElement>()
const closeButton = ref<HTMLButtonElement>()
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
      class="lightbox"
      :aria-label="t('gallery.expandedAlt', { number: props.index + 1 })"
      @cancel.prevent="close"
      @click="handleBackdropClick"
      @keydown.esc.prevent="close"
    >
      <button ref="closeButton" class="lightbox-close" type="button" @click="close">
        {{ $t('common.close') }}
      </button>
      <figure class="lightbox-frame">
        <img
          :src="props.src"
          :alt="t('gallery.expandedAlt', { number: props.index + 1 })"
          decoding="async"
          fetchpriority="high"
        >
      </figure>
    </dialog>
  </Teleport>
</template>

<style scoped>
.lightbox {
  width: 100vw;
  max-width: none;
  height: 100dvh;
  max-height: none;
  margin: 0;
  border: 0;
  color: var(--text);
  background: transparent;
  grid-template-rows: auto 1fr;
  place-items: center;
  padding: 24px;
}

.lightbox[open] {
  display: grid;
}

.lightbox::backdrop {
  background: rgba(5, 7, 10, 0.82);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.lightbox-frame {
  width: min(100%, 1100px);
  margin: 0;
}

.lightbox-frame img {
  width: 100%;
  max-height: 86vh;
  object-fit: contain;
}

.lightbox-close {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 1;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
  padding: 0.75rem 1rem;
  cursor: pointer;
}
</style>
