<script setup lang="ts">
defineProps<{
  post: {
    path: string
    title?: string
    description?: string
    date?: string
    cover?: string
    tags?: string[]
  }
  active?: boolean
}>()
</script>

<template>
  <NuxtLink
    :to="post.path"
    class="post-card glass-panel"
    :class="{ active }"
  >
    <div class="post-card-cover">
      <img v-if="post.cover" :src="post.cover" :alt="post.title || 'Post cover'" loading="lazy">
      <div v-else class="post-card-fallback" />
    </div>

    <div class="post-card-body">
      <div class="post-card-meta">
        <span>{{ post.date || 'No date' }}</span>
        <span v-if="post.tags?.length">{{ post.tags[0] }}</span>
      </div>
      <h3>{{ post.title }}</h3>
      <p>{{ post.description }}</p>
    </div>
  </NuxtLink>
</template>

<style scoped>
.post-card {
  display: grid;
  gap: 14px;
  padding: 12px;
  border-radius: var(--radius-lg);
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
}

.post-card:hover,
.post-card.active {
  transform: translateY(-2px);
  border-color: rgba(242, 195, 139, 0.35);
}

.post-card-cover {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: calc(var(--radius-lg) - 8px);
  background: rgba(255, 255, 255, 0.03);
}

.post-card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-card-fallback {
  width: 100%;
  height: 100%;
  background:
    linear-gradient(135deg, rgba(242, 195, 139, 0.9), rgba(145, 184, 255, 0.7)),
    radial-gradient(circle at top, rgba(255, 255, 255, 0.2), transparent 30%);
}

.post-card-body {
  display: grid;
  gap: 0.55rem;
}

.post-card-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--muted);
  font-size: 0.82rem;
}

.post-card h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.3rem;
  line-height: 1.1;
}

.post-card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
}
</style>
