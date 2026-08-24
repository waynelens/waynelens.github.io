<script setup lang="ts">
const props = withDefaults(defineProps<{
  src?: string
  alt?: string
  caption?: string
}>(), {
  src: '',
  alt: '',
  caption: ''
})

const { t } = useI18n()
const isLightboxOpen = ref(false)

const src = computed(() => props.src.trim())
const alt = computed(() => props.alt.trim())
const caption = computed(() => props.caption.trim())
const accessibleLabel = computed(() => (
  alt.value || caption.value || t('gallery.imageAlt', { number: 1 })
))
</script>

<template>
  <figure v-if="src" class="article-image">
    <button
      type="button"
      class="article-image__trigger"
      :aria-label="accessibleLabel"
      aria-haspopup="dialog"
      @click="isLightboxOpen = true"
    >
      <ResponsiveImage
        class="article-image__media"
        :src="src"
        :alt="alt"
        :default-width="1200"
        sizes="(max-width: 760px) calc(100vw - 44px), 1100px"
      />
    </button>

    <figcaption v-if="caption" class="article-image__caption">
      {{ caption }}
    </figcaption>

    <Lightbox
      :open="isLightboxOpen"
      :src="src"
      :alt="alt || caption"
      :index="0"
      @close="isLightboxOpen = false"
    />
  </figure>
</template>

<style scoped>
.article-image {
  width: 100%;
  margin: 1.75rem 0;
}

.article-image__trigger {
  display: block;
  width: 100%;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 18px;
  background: transparent;
  cursor: zoom-in;
}

.article-image__trigger:focus-visible {
  outline: 2px solid var(--accent-2);
  outline-offset: 4px;
}

.article-image__media {
  width: 100%;
  height: auto;
  margin: 0;
  transition: transform 220ms ease;
}

.article-image__trigger:hover .article-image__media {
  transform: scale(1.008);
}

.article-image__caption {
  margin-top: 0.7rem;
  color: var(--muted);
  font-size: 0.86rem;
  line-height: 1.6;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .article-image__media {
    transition: none;
  }
}
</style>
