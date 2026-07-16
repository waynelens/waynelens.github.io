<script setup lang="ts">
import { arrangeDailyGallery, getTaipeiDaySeed } from '~/utils/gallery'

const { locale, t } = useI18n()
const { data } = await useAsyncData('gallery-posts', () => queryCollection('blog').all())

const daySeed = ref('')
const isReady = ref(false)

const sourcePhotos = computed(() => {
  const seen = new Set<string>()
  const photos: { alt: string; src: string }[] = []
  const posts = [...(data.value || [])]
    .sort((a, b) => Number(b.lang === locale.value) - Number(a.lang === locale.value))

  for (const post of posts) {
    const sources = [post.cover, ...post.images].filter((source): source is string => Boolean(source))

    for (const source of sources) {
      if (seen.has(source)) continue
      seen.add(source)
      photos.push({
        alt: post.title || t('galleryPage.photoAlt'),
        src: source
      })
    }
  }

  return photos
})

const photos = computed(() => {
  if (!daySeed.value) return []
  return arrangeDailyGallery(sourcePhotos.value, daySeed.value)
})

onMounted(() => {
  daySeed.value = getTaipeiDaySeed()
  isReady.value = true
})

useSeoMeta({
  title: () => t('galleryPage.metaTitle'),
  description: () => t('galleryPage.metaDescription')
})
</script>

<template>
  <section class="gallery-page" :aria-label="$t('galleryPage.aria')">
    <PhotoMasonry
      v-if="isReady && photos.length"
      :key="`${locale}-${daySeed}`"
      :photos="photos"
    />

    <div v-else-if="!isReady" class="gallery-page-skeleton" aria-hidden="true">
      <span v-for="index in 8" :key="index" />
    </div>

    <p v-else class="gallery-page-empty">
      {{ $t('galleryPage.empty') }}
    </p>
  </section>
</template>

<style scoped>
.gallery-page {
  display: grid;
  gap: clamp(28px, 5vw, 52px);
}

.gallery-page-skeleton {
  column-count: 4;
  column-gap: 18px;
}

.gallery-page-skeleton span {
  display: block;
  min-height: 210px;
  margin-bottom: 18px;
  break-inside: avoid;
  border-radius: 18px;
  background: var(--bg-soft);
}

.gallery-page-skeleton span:nth-child(3n) {
  min-height: 320px;
}

.gallery-page-empty {
  margin: 0;
  padding: 36px;
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  color: var(--muted);
}

@media (max-width: 1080px) {
  .gallery-page-skeleton {
    column-count: 2;
  }
}

@media (max-width: 720px) {
  .gallery-page {
    gap: 28px;
  }

  .gallery-page-skeleton {
    column-count: 1;
  }
}
</style>
