<script setup lang="ts">
const props = defineProps<{
  post: {
    path: string
    title?: string
    description?: string
    date?: string
    cover?: string
    images?: string[]
    tags?: string[]
  }
}>()

const previewImage = computed(() => props.post.cover || props.post.images?.[0] || '')
const lightbox = ref({
  open: false,
  src: '',
  index: 0
})

const openPreview = () => {
  if (!previewImage.value) return
  lightbox.value = {
    open: true,
    src: previewImage.value,
    index: 0
  }
}
</script>

<template>
  <article class="home-post glass-panel">
    <button
      v-if="previewImage"
      class="home-post-image"
      type="button"
      :aria-label="`Open ${post.title || 'post'} preview image`"
      @click="openPreview"
    >
      <img :src="previewImage" :alt="post.title || 'Post preview image'" loading="lazy">
    </button>

    <div v-else class="home-post-fallback" aria-hidden="true" />

    <div class="home-post-body">
      <div class="home-post-meta">
        <span>{{ post.date || 'Unpublished' }}</span>
        <span v-if="post.tags?.length">{{ post.tags[0] }}</span>
      </div>

      <h2>{{ post.title }}</h2>

      <p v-if="post.description" class="home-post-description">
        {{ post.description }}
      </p>

      <div v-if="post.tags?.length" class="home-post-tags" aria-label="Post tags">
        <span v-for="tag in post.tags" :key="tag" class="chip">{{ tag }}</span>
      </div>

      <NuxtLink :to="post.path" class="home-post-link">
        Read post
      </NuxtLink>
    </div>

    <Lightbox
      :open="lightbox.open"
      :src="lightbox.src"
      :index="lightbox.index"
      @close="lightbox.open = false"
    />
  </article>
</template>

<style scoped>
.home-post {
  display: grid;
  grid-template-columns: minmax(0, 0.98fr) minmax(0, 1.02fr);
  gap: 16px;
  width: 100%;
  margin: 0 0 18px;
  padding: 14px;
  border-radius: var(--radius-xl);
  break-inside: avoid;
}

.home-post-image {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  border-radius: calc(var(--radius-xl) - 9px);
  overflow: hidden;
  background: var(--bg-soft);
  cursor: zoom-in;
}

.home-post-image img {
  width: 100%;
  height: auto;
  display: block;
}

.home-post-fallback {
  min-height: 260px;
  border-radius: calc(var(--radius-xl) - 9px);
  background:
    linear-gradient(135deg, rgba(242, 195, 139, 0.55), rgba(145, 184, 255, 0.45)),
    var(--bg-soft);
}

.home-post-body {
  display: grid;
  align-content: end;
  gap: 12px;
  min-width: 0;
  padding: clamp(8px, 1.4vw, 18px);
}

.home-post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: var(--muted);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.home-post h2 {
  margin: 0;
  color: var(--text);
  font-family: var(--font-display);
  font-size: clamp(1.55rem, 2vw, 2.35rem);
  font-weight: 500;
  line-height: 1.02;
}

.home-post-description {
  margin: 0;
  color: var(--muted);
  line-height: 1.65;
}

.home-post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.home-post-link {
  justify-self: start;
  color: var(--text);
  font-size: 0.86rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.home-post-link::after {
  content: "";
  display: block;
  width: 100%;
  height: 1px;
  margin-top: 5px;
  background: currentColor;
  transform-origin: left;
  transition: transform 180ms ease;
}

.home-post-link:hover::after {
  transform: scaleX(0.62);
}

@media (max-width: 860px) {
  .home-post {
    grid-template-columns: 1fr;
    gap: 0;
    padding: 12px;
  }

  .home-post-body {
    padding: 18px 8px 8px;
  }
}
</style>
