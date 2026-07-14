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

const close = () => {
  // Emitting keeps the overlay controlled by the parent gallery.
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="lightbox">
      <div v-if="props.open" class="lightbox" @click.self="close">
        <button class="lightbox-close" type="button" @click="close">{{ $t('common.close') }}</button>
        <figure class="lightbox-frame">
          <img
            :src="props.src"
            :alt="t('gallery.expandedAlt', { number: props.index + 1 })"
            decoding="async"
            fetchpriority="high"
          >
        </figure>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(5, 7, 10, 0.82);
  backdrop-filter: blur(16px);
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
  position: fixed;
  top: 18px;
  right: 18px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
  padding: 0.75rem 1rem;
  cursor: pointer;
}

.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 180ms ease;
}

.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}
</style>
