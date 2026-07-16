<script setup lang="ts">
const route = useRoute()
const normalizedPath = computed(() => route.path.replace(/\/+$/, '') || '/')
const showBottomNav = computed(() => normalizedPath.value === '/' || normalizedPath.value === '/gallery')
</script>

<template>
  <div class="app-shell" :class="{ 'has-bottom-nav': showBottomNav }">
    <AppHeader />
    <SearchPalette />
    <RssSubscribeDialog />
    <main class="app-main">
      <slot />
    </main>
    <BottomPageNav v-if="showBottomNav" />
  </div>
</template>

<style scoped>
.has-bottom-nav .app-main {
  padding-bottom: 132px;
}
</style>
