<script setup lang="ts">
import type { GalleryPhoto } from '~/utils/gallery'

const props = defineProps<{
  photos: GalleryPhoto[]
}>()

const LOOP_COUNT = 3
const LANDSCAPE_WIDE_RATIO = 1.15

const loopRoot = ref<HTMLElement | null>(null)
const sentinel = ref<HTMLElement | null>(null)
const cycles = ref(Array.from({ length: LOOP_COUNT }, (_, index) => index))
const imageRatios = reactive(new Map<string, number>())
const lightbox = ref({
  index: 0,
  open: false,
  src: ''
})

let intersectionObserver: IntersectionObserver | null = null
let resizeObserver: ResizeObserver | null = null
let layoutFrame = 0
let recycling = false

const wideSources = computed(() => {
  const widePhotoCount = Math.max(1, Math.round(props.photos.length / 5))

  return new Set(
    props.photos
      .filter(photo => (imageRatios.get(photo.src) ?? 0) >= LANDSCAPE_WIDE_RATIO)
      .sort((a, b) => a.wideRank - b.wideRank || a.src.localeCompare(b.src))
      .slice(0, widePhotoCount)
      .map(photo => photo.src)
  )
})

const isWide = (photo: GalleryPhoto) => {
  return wideSources.value.has(photo.src)
}

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

const handleImageLoad = async (event: Event) => {
  const image = event.target
  if (!(image instanceof HTMLImageElement)) return

  const source = image.dataset.gallerySource
  if (source && image.naturalWidth && image.naturalHeight) {
    imageRatios.set(source, image.naturalWidth / image.naturalHeight)
  }

  await nextTick()
  scheduleLayout()
}

const recycleCycles = async () => {
  if (recycling || cycles.value.length < LOOP_COUNT || !loopRoot.value) return
  recycling = true

  const anchorCycle = cycles.value[1]
  const anchorBefore = loopRoot.value.querySelector<HTMLElement>(`[data-cycle="${anchorCycle}"]`)
  const anchorTopBefore = anchorBefore?.getBoundingClientRect().top
  const nextCycle = cycles.value[cycles.value.length - 1] + 1

  cycles.value = [...cycles.value.slice(1), nextCycle]
  await nextTick()
  layoutGrids()
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

  const anchorAfter = loopRoot.value?.querySelector<HTMLElement>(`[data-cycle="${anchorCycle}"]`)
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
      void recycleCycles()
    }
  }, {
    rootMargin: '400px 0px 400px'
  })
  intersectionObserver.observe(sentinel.value)

  scheduleLayout()
})

watch(() => props.photos, async () => {
  imageRatios.clear()
  cycles.value = Array.from({ length: LOOP_COUNT }, (_, index) => index)
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
    <div
      v-for="cycle in cycles"
      :key="cycle"
      class="photo-dense-grid"
      :data-cycle="cycle"
    >
      <button
        v-for="(photo, index) in photos"
        :key="`${cycle}:${photo.src}`"
        class="photo-dense-item"
        :class="{ 'photo-dense-item--wide': isWide(photo) }"
        type="button"
        :aria-label="photo.alt"
        :data-photo-index="index"
        @click="openImage(photo, index)"
      >
        <ResponsiveImage
          class="photo-dense-image"
          :src="photo.src"
          :alt="photo.alt"
          :data-gallery-source="photo.src"
          :default-width="isWide(photo) ? 1200 : 768"
          :sizes="isWide(photo)
            ? '(max-width: 720px) calc(100vw - 20px), (max-width: 1080px) 66vw, 40vw'
            : '(max-width: 720px) calc(50vw - 16px), (max-width: 1080px) 32vw, 20vw'"
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
  display: grid;
  gap: 18px;
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

.photo-dense-item--wide {
  grid-column: span 2;
}

.photo-dense-image {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: auto 3 / 2;
}

.photo-dense-sentinel {
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
  .photo-dense-loop,
  .photo-dense-grid {
    gap: 12px;
  }

  .photo-dense-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: 6px;
  }

  .photo-dense-item {
    border-radius: 14px;
  }
}
</style>
