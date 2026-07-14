<template>
  <div class="app-shell">
    <AppHeader />
    <SearchPalette />
    <RssSubscribeDialog />
    <main class="app-main">
      <slot />
    </main>
  </div>
</template>
