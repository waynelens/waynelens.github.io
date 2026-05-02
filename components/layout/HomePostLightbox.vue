<script setup lang="ts">
const props = defineProps<{
  open: boolean
  post: {
    path: string
    title?: string
    description?: string
    date?: string
    images?: string[]
    tags?: string[]
    body?: unknown
  }
}>()

const emit = defineEmits<{
  close: []
}>()

const close = () => {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="home-post-lightbox">
      <div v-if="props.open" class="home-post-lightbox" @click.self="close">
        <div class="home-post-lightbox-panel glass-panel">
          <button class="home-post-lightbox-close" type="button" @click="close">
            Close
          </button>

          <header class="home-post-lightbox-head">
            <p class="eyebrow">Post preview</p>
            <h2 class="section-title">{{ props.post.title }}</h2>
            <p v-if="props.post.description" class="home-post-lightbox-description">
              {{ props.post.description }}
            </p>

            <div class="home-post-lightbox-meta">
              <span class="chip">{{ props.post.date || 'Unpublished' }}</span>
              <span
                v-for="tag in props.post.tags || []"
                :key="tag"
                class="chip"
              >
                {{ tag }}
              </span>
            </div>
          </header>

          <div class="home-post-lightbox-content">
            <ContentRenderer v-if="props.post.body" :value="props.post" />
          </div>

          <NuxtLink :to="props.post.path" class="home-post-lightbox-link">
            Open full post
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.home-post-lightbox {
  position: fixed;
  inset: 0;
  z-index: 110;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(5, 7, 10, 0.82);
  backdrop-filter: blur(16px);
}

.home-post-lightbox-panel {
  position: relative;
  width: min(100%, 1100px);
  max-height: min(90vh, 1100px);
  padding: clamp(20px, 3vw, 32px);
  border-radius: var(--radius-xl);
  display: grid;
  gap: 18px;
  overflow: auto;
}

.home-post-lightbox-close {
  position: sticky;
  top: 0;
  justify-self: end;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--bg);
  color: var(--text);
  padding: 0.7rem 0.95rem;
  cursor: pointer;
}

.home-post-lightbox-head {
  display: grid;
  gap: 12px;
}

.home-post-lightbox-head h2 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.4rem);
  line-height: 1;
}

.home-post-lightbox-description {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
  max-width: 65ch;
}

.home-post-lightbox-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.home-post-lightbox-content {
  line-height: 1.8;
}

.home-post-lightbox-content :deep(h2),
.home-post-lightbox-content :deep(h3) {
  font-family: var(--font-display);
  line-height: 1.08;
}

.home-post-lightbox-content :deep(h2) {
  margin-top: 2rem;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
}

.home-post-lightbox-content :deep(p),
.home-post-lightbox-content :deep(li) {
  color: var(--text);
}

.home-post-lightbox-content :deep(img) {
  width: 100%;
  height: auto;
  border-radius: 18px;
  margin: 1.4rem 0;
}

.home-post-lightbox-link {
  justify-self: start;
  color: var(--text);
  font-size: 0.86rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.home-post-lightbox-link::after {
  content: "";
  display: block;
  width: 100%;
  height: 1px;
  margin-top: 5px;
  background: currentColor;
}

.home-post-lightbox-enter-active,
.home-post-lightbox-leave-active {
  transition: opacity 180ms ease;
}

.home-post-lightbox-enter-from,
.home-post-lightbox-leave-to {
  opacity: 0;
}

@media (max-width: 700px) {
  .home-post-lightbox {
    padding: 10px;
  }

  .home-post-lightbox-panel {
    max-height: 94vh;
  }
}
</style>
