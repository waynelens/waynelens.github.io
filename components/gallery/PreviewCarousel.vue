<script setup lang="ts">
const { t } = useI18n()
const props = defineProps<{
  images: string[]
  title?: string
}>()

const current = ref(0)

watch(
  () => props.images,
  () => {
    current.value = 0
  }
)

const next = () => {
  if (!props.images.length) return
  current.value = (current.value + 1) % props.images.length
}

const prev = () => {
  if (!props.images.length) return
  current.value = (current.value - 1 + props.images.length) % props.images.length
}
</script>

<template>
  <section class="carousel glass-panel">
    <div class="carousel-stage">
      <img
        v-if="images.length"
        :src="images[current]"
        :alt="title || t('carousel.previewImage')"
      >
      <div v-else class="carousel-empty">
        <span>{{ $t('carousel.noImage') }}</span>
      </div>
    </div>

    <div class="carousel-footer">
      <div class="carousel-controls">
        <button type="button" @click="prev">{{ $t('carousel.previous') }}</button>
        <button type="button" @click="next">{{ $t('carousel.next') }}</button>
      </div>

      <div v-if="images.length" class="carousel-dots" :aria-label="$t('carousel.navigation')">
        <button
          v-for="(image, index) in images"
          :key="image + index"
          type="button"
          :class="{ active: index === current }"
          @click="current = index"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.carousel {
  border-radius: var(--radius-xl);
  padding: 14px;
  display: grid;
  gap: 14px;
}

.carousel-stage {
  position: relative;
  aspect-ratio: 4 / 5;
  border-radius: calc(var(--radius-xl) - 8px);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
}

.carousel-stage img,
.carousel-empty {
  width: 100%;
  height: 100%;
}

.carousel-stage img {
  object-fit: cover;
}

.carousel-empty {
  display: grid;
  place-items: center;
  color: var(--muted);
  background:
    radial-gradient(circle at 20% 20%, rgba(242, 195, 139, 0.24), transparent 22%),
    radial-gradient(circle at 80% 40%, rgba(145, 184, 255, 0.22), transparent 24%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.015));
}

.carousel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.carousel-controls {
  display: inline-flex;
  gap: 8px;
}

.carousel-controls button,
.carousel-dots button {
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text);
  cursor: pointer;
}

.carousel-controls button {
  border-radius: 999px;
  padding: 0.6rem 0.9rem;
}

.carousel-dots {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.carousel-dots button {
  width: 10px;
  height: 10px;
  padding: 0;
  border-radius: 50%;
  opacity: 0.5;
}

.carousel-dots button.active {
  opacity: 1;
  transform: scale(1.12);
  background: var(--accent);
}
</style>
