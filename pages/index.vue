<script setup lang="ts">
const { locale } = useI18n()
const { data } = await useAsyncData('home-posts', () => queryCollection('blog').all())

const posts = computed(() => {
  return [...(data.value || [])]
    .filter(post => post.lang === locale.value)
    .sort((a, b) => {
      return String(b.date || '').localeCompare(String(a.date || ''))
    })
})

useSeoMeta({
  title: 'Wayne Jin',
  description: 'A focused header-first workspace for refining the AppHeader presentation.'
})
</script>

<template>
  <section class="home-feed fade-up" :aria-label="$t('home.aria')">
    <HomePostPreview
      v-for="post in posts"
      :key="post.path"
      :post="post"
    />

    <div v-if="!posts.length" class="home-empty glass-panel">
      <p class="eyebrow">{{ $t('home.noPosts') }}</p>
      <h1 class="section-title">{{ $t('home.comingSoon') }}</h1>
    </div>
  </section>
</template>

<style scoped>
.home-feed {
  min-height: calc(100vh - 180px);
  column-count: 2;
  column-gap: 18px;
}

.home-empty {
  display: grid;
  gap: 10px;
  padding: clamp(22px, 4vw, 40px);
  border-radius: var(--radius-xl);
  break-inside: avoid;
}

.home-empty h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.8rem);
  line-height: 1;
}

@media (max-width: 1080px) {
  .home-feed {
    column-count: 1;
  }
}
</style>
