<script setup lang="ts">
import type { GalleryPhoto } from '~/utils/gallery'

const props = defineProps<{
  photos: GalleryPhoto[]
}>()

const MAX_RENDERED_ITEMS = 72
const MIN_RENDERED_ITEMS = 48

const loopRoot = ref<HTMLElement | null>(null)
const sentinel = ref<HTMLElement | null>(null)
const windowStart = ref(0)
const lightbox = ref({
  index: 0,
  open: false,
  src: ''
})

let intersectionObserver: IntersectionObserver | null = null
let resizeObserver: ResizeObserver | null = null
let layoutFrame = 0
let recycling = false

const renderedPhotos = computed(() => {
  if (!props.photos.length) return []

  const itemCount = Math.min(
    MAX_RENDERED_ITEMS,
    Math.max(MIN_RENDERED_ITEMS, props.photos.length * 3)
  )

  return Array.from({ length: itemCount }, (_, offset) => {
    const sequence = windowStart.value + offset
    const index = sequence % props.photos.length

    return {
      index,
      photo: props.photos[index],
      sequence
    }
  })
})

const recycleBatchSize = computed(() => {
  if (!props.photos.length) return 0
  return Math.min(
    props.photos.length,
    Math.max(1, Math.floor(renderedPhotos.value.length / 3))
  )
})

const openImage = (photo: GalleryPhoto, index: number) => {
  lightbox.value = {
    index,
    open: true,
    src: photo.src
  }
}

const layoutGrids = () => {
  if (!loopRoot.value) return

  const grids = loopRoot.value.querySelectorAll<HTMLElement>('.photo-dense-grid')

  for (const grid of grids) {
    const styles = getComputedStyle(grid)
    const rowHeight = Number.parseFloat(styles.gridAutoRows)
    const rowGap = Number.parseFloat(styles.rowGap)

    if (!rowHeight) continue

    for (const item of grid.querySelectorAll<HTMLElement>('.photo-dense-item')) {
      const image = item.querySelector<HTMLImageElement>('img')
      if (!image) continue

      const imageHeight = image.getBoundingClientRect().height
      if (!imageHeight) continue

      const span = Math.ceil((imageHeight + rowGap) / (rowHeight + rowGap))
      item.style.gridRowEnd = `span ${span}`
    }
  }
}

const scheduleLayout = () => {
  cancelAnimationFrame(layoutFrame)
  layoutFrame = requestAnimationFrame(() => {
    layoutGrids()
  })
}

const handleImageLoad = () => {
  scheduleLayout()
}

const recycleWindow = async () => {
  if (recycling || !recycleBatchSize.value || !loopRoot.value) return
  recycling = true

  const anchorSequence = windowStart.value + recycleBatchSize.value
  const anchorBefore = loopRoot.value.querySelector<HTMLElement>(
    `[data-sequence="${anchorSequence}"]`
  )
  const anchorTopBefore = anchorBefore?.getBoundingClientRect().top

  windowStart.value += recycleBatchSize.value
  await nextTick()
  layoutGrids()
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

  const anchorAfter = loopRoot.value?.querySelector<HTMLElement>(
    `[data-sequence="${anchorSequence}"]`
  )
  if (anchorTopBefore !== undefined && anchorAfter) {
    window.scrollBy({
      top: anchorAfter.getBoundingClientRect().top - anchorTopBefore,
      behavior: 'auto'
    })
  }

  recycling = false
}

onMounted(() => {
  if (!loopRoot.value || !sentinel.value) return

  resizeObserver = new ResizeObserver(scheduleLayout)
  resizeObserver.observe(loopRoot.value)

  intersectionObserver = new IntersectionObserver((entries) => {
    if (entries.some(entry => entry.isIntersecting)) {
      void recycleWindow()
    }
  }, {
    rootMargin: '400px 0px 400px'
  })
  intersectionObserver.observe(sentinel.value)

  scheduleLayout()
})

watch(() => props.photos, async () => {
  windowStart.value = 0
  await nextTick()
  scheduleLayout()
})

onBeforeUnmount(() => {
  intersectionObserver?.disconnect()
  resizeObserver?.disconnect()
  cancelAnimationFrame(layoutFrame)
})
</script>

<template>
  <div
    ref="loopRoot"
    class="photo-dense-loop"
    @load.capture="handleImageLoad"
  >
    <div class="photo-dense-grid">
      <button
        v-for="entry in renderedPhotos"
        :key="entry.sequence"
        class="photo-dense-item"
        type="button"
        :aria-label="entry.photo.alt"
        :data-photo-index="entry.index"
        :data-sequence="entry.sequence"
        @click="openImage(entry.photo, entry.index)"
      >
        <ResponsiveImage
          class="photo-dense-image"
          :src="entry.photo.src"
          :alt="entry.photo.alt"
          :default-width="768"
          sizes="(max-width: 720px) calc(50vw - 16px), (max-width: 1080px) 32vw, 20vw"
        />
      </button>
    </div>

    <span ref="sentinel" class="photo-dense-sentinel" aria-hidden="true" />

    <Lightbox
      :open="lightbox.open"
      :src="lightbox.src"
      :index="lightbox.index"
      @close="lightbox.open = false"
    />
  </div>
</template>

<style scoped>
.photo-dense-loop {
  width: 100%;
}

.photo-dense-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  grid-auto-flow: dense;
  grid-auto-rows: 8px;
  gap: 18px;
  width: 100%;
}

.photo-dense-item {
  display: block;
  align-self: start;
  min-width: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 18px;
  background: transparent;
  color: inherit;
  cursor: zoom-in;
}

.photo-dense-image {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: auto 3 / 2;
}

.photo-dense-sentinel {
  display: block;
  width: 1px;
  height: 1px;
  pointer-events: none;
}

@media (max-width: 1080px) {
  .photo-dense-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .photo-dense-grid {
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: 6px;
  }

  .photo-dense-item {
    border-radius: 14px;
  }
}
</style>
