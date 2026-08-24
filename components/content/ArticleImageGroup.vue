<script setup lang="ts">
type ArticleImageInput = string | {
  src?: string
  alt?: string
  caption?: string
}

type ArticleImageItem = {
  src: string
  alt: string
  caption: string
}

const props = withDefaults(defineProps<{
  images?: ArticleImageInput[]
}>(), {
  images: () => []
})

const { t } = useI18n()

const images = computed<ArticleImageItem[]>(() => props.images.flatMap((image) => {
  if (typeof image === 'string') {
    const src = image.trim()
    return src ? [{ src, alt: '', caption: '' }] : []
  }

  const src = image?.src?.trim() || ''
  if (!src) return []

  return [{
    src,
    alt: image.alt?.trim() || '',
    caption: image.caption?.trim() || ''
  }]
}))

const columnClass = computed(() => `has-${Math.min(images.value.length, 3)}-columns`)

const lightbox = ref({
  open: false,
  src: '',
  alt: '',
  index: 0
})

const getAccessibleLabel = (image: ArticleImageItem, index: number) => (
  image.alt || image.caption || t('gallery.imageAlt', { number: index + 1 })
)

const openImage = (image: ArticleImageItem, index: number) => {
  lightbox.value = {
    open: true,
    src: image.src,
    alt: image.alt || image.caption,
    index
  }
}
</script>

<template>
  <div v-if="images.length" class="article-image-group">
    <div class="article-image-group__grid" :class="columnClass">
      <figure
        v-for="(image, index) in images"
        :key="`${image.src}-${index}`"
        class="article-image-group__item"
      >
        <button
          type="button"
          class="article-image-group__trigger"
          :aria-label="getAccessibleLabel(image, index)"
          aria-haspopup="dialog"
          @click="openImage(image, index)"
        >
          <ResponsiveImage
            class="article-image-group__media"
            :src="image.src"
            :alt="image.alt"
            :default-width="768"
            sizes="(max-width: 640px) calc((100vw - 58px) / 2), (max-width: 960px) calc((100vw - 90px) / 2), 33vw"
          />
        </button>

        <figcaption v-if="image.caption" class="article-image-group__caption">
          {{ image.caption }}
        </figcaption>
      </figure>
    </div>

    <Lightbox
      :open="lightbox.open"
      :src="lightbox.src"
      :alt="lightbox.alt"
      :index="lightbox.index"
      @close="lightbox.open = false"
    />
  </div>
</template>

<style scoped>
.article-image-group {
  width: 100%;
  margin: 1.75rem 0;
}

.article-image-group__grid {
  display: grid;
  align-items: start;
  gap: 14px;
}

.article-image-group__grid.has-1-columns {
  grid-template-columns: minmax(0, 1fr);
}

.article-image-group__grid.has-2-columns {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.article-image-group__grid.has-3-columns {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.article-image-group__item {
  min-width: 0;
  margin: 0;
}

.article-image-group__trigger {
  display: block;
  width: 100%;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 16px;
  background: transparent;
  cursor: zoom-in;
}

.article-image-group__trigger:focus-visible {
  outline: 2px solid var(--accent-2);
  outline-offset: 3px;
}

.article-image-group__media {
  width: 100%;
  height: auto;
  margin: 0;
  transition: transform 220ms ease;
}

.article-image-group__trigger:hover .article-image-group__media {
  transform: scale(1.012);
}

.article-image-group__caption {
  margin-top: 0.55rem;
  color: var(--muted);
  font-size: 0.78rem;
  line-height: 1.55;
  text-align: center;
}

@media (max-width: 960px) {
  .article-image-group__grid.has-3-columns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .article-image-group__grid {
    gap: 10px;
  }

  .article-image-group__trigger {
    border-radius: 13px;
  }

  .article-image-group__caption {
    font-size: 0.74rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .article-image-group__media {
    transition: none;
  }
}
</style>
