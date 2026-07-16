<script setup lang="ts">
import type Masonry from 'masonry-layout'
import type imagesLoaded from 'imagesloaded'
import type { GalleryPhoto } from '~/utils/gallery'

const props = defineProps<{
  photos: GalleryPhoto[]
}>()

const grid = ref<HTMLElement | null>(null)
const lightbox = ref({
  index: 0,
  open: false,
  src: ''
})

let masonry: Masonry | null = null
let imageLoader: ReturnType<typeof imagesLoaded> | null = null

const layout = () => {
  requestAnimationFrame(() => masonry?.layout?.())
}

const openImage = (photo: GalleryPhoto, index: number) => {
  lightbox.value = {
    index,
    open: true,
    src: photo.src
  }
}

onMounted(async () => {
  if (!grid.value) return

  const [{ default: MasonryConstructor }, { default: loadImages }] = await Promise.all([
    import('masonry-layout'),
    import('imagesloaded')
  ])

  masonry = new MasonryConstructor(grid.value, {
    columnWidth: '.photo-masonry-sizer',
    gutter: '.photo-masonry-gutter',
    itemSelector: '.photo-masonry-item',
    percentPosition: true,
    transitionDuration: 0
  })

  imageLoader = loadImages(grid.value)
  imageLoader.on('progress', layout)
  imageLoader.on('always', layout)
})

watch(() => props.photos, async () => {
  if (!masonry) return
  await nextTick()
  masonry.reloadItems?.()
  layout()
})

onBeforeUnmount(() => {
  imageLoader?.off('progress', layout)
  imageLoader?.off('always', layout)
  masonry?.destroy?.()
})
</script>

<template>
  <div ref="grid" class="photo-masonry">
    <div class="photo-masonry-sizer" aria-hidden="true" />
    <div class="photo-masonry-gutter" aria-hidden="true" />

    <button
      v-for="(photo, index) in photos"
      :key="photo.src"
      class="photo-masonry-item"
      :class="{ 'photo-masonry-item--wide': photo.wide }"
      type="button"
      :aria-label="photo.alt"
      @click="openImage(photo, index)"
    >
      <ResponsiveImage
        class="photo-masonry-image"
        :src="photo.src"
        :alt="photo.alt"
        :default-width="photo.wide ? 1200 : 768"
        :sizes="photo.wide
          ? '(max-width: 720px) calc(100vw - 20px), (max-width: 1080px) 66vw, 40vw'
          : '(max-width: 720px) calc(50vw - 16px), (max-width: 1080px) 32vw, 20vw'"
      />
    </button>

    <Lightbox
      :open="lightbox.open"
      :src="lightbox.src"
      :index="lightbox.index"
      @close="lightbox.open = false"
    />
  </div>
</template>

<style scoped>
.photo-masonry {
  width: 100%;
}

.photo-masonry-sizer,
.photo-masonry-item {
  width: 18.8%;
}

.photo-masonry-gutter {
  width: 1.5%;
}

.photo-masonry-item {
  display: block;
  margin: 0 0 18px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: zoom-in;
}

.photo-masonry-item--wide {
  width: 39.1%;
}

.photo-masonry-image {
  width: 100%;
  height: auto;
  aspect-ratio: auto 3 / 2;
  border-radius: 18px;
}

@media (max-width: 1080px) {
  .photo-masonry-sizer,
  .photo-masonry-item {
    width: 32%;
  }

  .photo-masonry-gutter {
    width: 2%;
  }

  .photo-masonry-item--wide {
    width: 66%;
  }
}

@media (max-width: 720px) {
  .photo-masonry-sizer,
  .photo-masonry-item {
    width: 49%;
  }

  .photo-masonry-gutter {
    width: 2%;
  }

  .photo-masonry-item--wide {
    width: 100%;
  }

  .photo-masonry-item {
    margin-bottom: 12px;
  }

  .photo-masonry-image {
    border-radius: 14px;
  }
}
</style>
