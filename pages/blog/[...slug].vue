<script setup lang="ts">
const route = useRoute()
const { locale, setLocale } = useI18n()

const { data: post } = await useAsyncData(route.path, () => {
  return queryCollection('blog').path(route.path).first()
})

if (post.value?.lang && locale.value !== post.value.lang) {
  await setLocale(post.value.lang)
}

const images = computed(() => {
  const value = post.value?.images || []
  return Array.isArray(value) ? value : []
})

const shareImage = computed(() => post.value?.cover || images.value[0] || '')

useSeoMeta({
  title: () => post.value?.title || 'Article',
  description: () => post.value?.description || 'Photography story'
})
</script>

<template>
  <article v-if="post" class="article fade-up">
    <header class="article-hero glass-panel">
      <div class="article-head">
        <p class="eyebrow">{{ $t('post.narrative') }}</p>
        <h1 class="section-title">{{ post.title }}</h1>
        <p class="article-description">{{ post.description }}</p>

        <div class="article-meta">
          <span class="chip">{{ post.date || $t('common.unpublished') }}</span>
          <span v-for="tag in post.tags || []" :key="tag" class="chip">{{ tag }}</span>
        </div>

        <StoryShareButton
          v-if="shareImage"
          :title="post.title"
          :image-url="shareImage"
          :path="post.path"
          :lang="post.lang"
        />
      </div>

      <PreviewCarousel :images="images" :title="post.title" />
    </header>

    <section class="article-body glass-panel">
      <ContentRenderer :value="post" />
    </section>

    <PostGallery v-if="images.length" :images="images" />
  </article>

  <div v-else class="article-not-found glass-panel">
    <p class="eyebrow">404</p>
    <h1 class="section-title">{{ $t('post.notFound') }}</h1>
    <NuxtLink to="/" class="read-more">{{ $t('post.backHome') }}</NuxtLink>
  </div>
</template>

<style scoped>
.article {
  display: grid;
  gap: 24px;
  min-width: 0;
}

.article-hero,
.article-body,
.article-not-found {
  border-radius: var(--radius-xl);
}

.article-hero {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
  gap: 18px;
  padding: 18px;
  min-width: 0;
}

.article-head {
  padding: clamp(16px, 2vw, 20px);
  display: grid;
  align-content: end;
  gap: 14px;
}

.article-head h1 {
  font-size: clamp(2.4rem, 5vw, 4.5rem);
  line-height: 0.95;
  margin: 0;
}

.article-description {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
  max-width: 50ch;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.article-body {
  padding: clamp(22px, 3vw, 34px);
  line-height: 1.8;
}

.article-body :deep(h2),
.article-body :deep(h3) {
  font-family: var(--font-display);
  line-height: 1.1;
}

.article-body :deep(h2) {
  margin-top: 2rem;
  font-size: clamp(1.7rem, 3vw, 2.2rem);
}

.article-body :deep(p),
.article-body :deep(li) {
  color: var(--text);
}

.article-body :deep(img) {
  border-radius: 18px;
  margin: 1.4rem 0;
}

.article-not-found {
  padding: 32px;
  display: grid;
  gap: 12px;
}

@media (max-width: 980px) {
  .article-hero {
    grid-template-columns: 1fr;
  }
}
</style>
