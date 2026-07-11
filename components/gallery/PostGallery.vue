<script setup lang="ts">
const { t } = useI18n()
defineProps<{
  images: string[]
}>()

const lightbox = ref<{ open: boolean; src: string; index: number }>({
  open: false,
  src: '',
  index: 0
})

const openImage = (src: string, index: number) => {
  lightbox.value = { open: true, src, index }
}
</script>

<template>
  <section class="gallery stack">
    <div class="gallery-head">
      <div>
        <p class="eyebrow">{{ $t('gallery.collection') }}</p>
        <h2 class="section-title">{{ $t('gallery.full') }}</h2>
      </div>
      <p class="muted">
        {{ $t('gallery.description') }}
      </p>
    </div>

    <div class="gallery-grid">
      <button
        v-for="(image, index) in images"
        :key="image + index"
        type="button"
        class="gallery-tile"
        @click="openImage(image, index)"
      >
        <img :src="image" :alt="t('gallery.imageAlt', { number: index + 1 })" loading="lazy">
      </button>
    </div>

    <Lightbox
      :open="lightbox.open"
      :src="lightbox.src"
      :index="lightbox.index"
      @close="lightbox.open = false"
    />
  </section>
</template>

<style scoped>
.gallery {
  margin-top: 32px;
}

.gallery-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
}

.gallery-head h2 {
  margin-top: 6px;
  font-size: clamp(1.8rem, 3vw, 2.5rem);
}

.gallery-head p {
  margin: 0;
  max-width: 42ch;
}

.gallery-grid {
  column-count: 3;
  column-gap: 14px;
}

.gallery-tile {
  width: 100%;
  margin: 0 0 14px;
  padding: 0;
  border: 0;
  border-radius: 18px;
  overflow: hidden;
  background: transparent;
  cursor: zoom-in;
  break-inside: avoid;
}

.gallery-tile img {
  width: 100%;
  height: auto;
}

@media (max-width: 960px) {
  .gallery-grid {
    column-count: 2;
  }
}

@media (max-width: 640px) {
  .gallery-head {
    flex-direction: column;
    align-items: start;
  }

  .gallery-grid {
    column-count: 1;
  }
}
</style>
