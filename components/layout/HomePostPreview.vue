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
const contentLightbox = ref(false)

const openPreview = () => {
  if (!previewImage.value) return
  contentLightbox.value = true
}
</script>

<template>
  <article class="home-post glass-panel">
    <button
      v-if="previewImage"
      class="home-post-image"
      type="button"
      :aria-label="`Open ${post.title || 'post'} content preview`"
      @click="openPreview"
    >
      <img :src="previewImage" :alt="post.title || 'Post preview image'" loading="lazy">
    </button>

    <div v-else class="home-post-fallback" aria-hidden="true" />

    <div class="home-post-body">
      <div class="home-post-meta">
        <span>{{ post.date || 'Unpublished' }}</span>
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

    <HomePostLightbox
      :open="contentLightbox"
      :post="post"
      @close="contentLightbox = false"
    />
  </article>
</template>

<style scoped>
.home-post {
  display: grid;
  grid-template-columns: minmax(0, 0.98fr) minmax(0, 1.02fr);
  gap: 16px;
  align-items: stretch;
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
  cursor: pointer;
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
  grid-template-rows: auto auto 1fr auto auto;
  height: 100%;
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
  font-size: clamp(1.2rem, 1.45vw, 1.9rem);
  font-weight: 500;
  line-height: 1.08;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
    grid-template-rows: auto auto auto auto auto;
    height: auto;
    padding: 18px 8px 8px;
  }

  .home-post h2 {
    font-size: clamp(1.1rem, 4.4vw, 1.5rem);
  }
}
</style>
