<script setup lang="ts">
const route = useRoute()

const normalizedPath = computed(() => route.path.replace(/\/+$/, '') || '/')
const isActive = (path: string) => normalizedPath.value === path
</script>

<template>
  <nav class="bottom-page-nav" :aria-label="$t('navigation.primary')">
    <span
      class="bottom-page-nav-indicator"
      :class="{ 'is-gallery': isActive('/gallery') }"
      aria-hidden="true"
    />

    <NuxtLink
      to="/"
      class="bottom-page-nav-link"
      :class="{ 'is-active': isActive('/') }"
      :aria-label="$t('navigation.home')"
      :aria-current="isActive('/') ? 'page' : undefined"
      :title="$t('navigation.home')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3.5 10.75 12 3.5l8.5 7.25V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z" />
      </svg>
    </NuxtLink>

    <NuxtLink
      to="/gallery"
      class="bottom-page-nav-link"
      :class="{ 'is-active': isActive('/gallery') }"
      :aria-label="$t('navigation.gallery')"
      :aria-current="isActive('/gallery') ? 'page' : undefined"
      :title="$t('navigation.gallery')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m5.5 18 4.3-4.5 3.2 3 2.1-2.1 3.4 3.6" />
      </svg>
    </NuxtLink>
  </nav>
</template>

<style scoped>
.bottom-page-nav {
  --nav-item-size: 48px;
  --nav-item-step: 54px;

  position: fixed;
  left: 50%;
  bottom: max(18px, env(safe-area-inset-bottom));
  z-index: 80;
  isolation: isolate;
  display: grid;
  grid-template-columns: repeat(2, var(--nav-item-size));
  gap: 6px;
  overflow: hidden;
  padding: 6px;
  border: 1px solid rgba(255, 255, 255, 0.48);
  border-radius: 999px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0.08) 48%, rgba(255, 255, 255, 0.18)),
    color-mix(in srgb, var(--page-bg) 38%, transparent);
  box-shadow:
    0 14px 40px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.62),
    inset 0 -1px 0 rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(28px) saturate(1.7);
  -webkit-backdrop-filter: blur(28px) saturate(1.7);
  transform: translateX(-50%);
}

.bottom-page-nav-indicator {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 0;
  width: var(--nav-item-size);
  aspect-ratio: 1;
  border-radius: 50%;
  background: color-mix(in srgb, var(--text) 88%, transparent);
  box-shadow:
    0 5px 14px rgba(0, 0, 0, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
  pointer-events: none;
  transition: transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
}

.bottom-page-nav-indicator.is-gallery {
  transform: translateX(var(--nav-item-step));
}

.bottom-page-nav::before {
  position: absolute;
  z-index: -1;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.22), transparent 48%);
  pointer-events: none;
  content: '';
}

.bottom-page-nav-link {
  position: relative;
  z-index: 1;
  display: grid;
  width: var(--nav-item-size);
  aspect-ratio: 1;
  place-items: center;
  border-radius: 50%;
  color: var(--muted);
  transition: color 240ms ease, transform 160ms ease;
}

.bottom-page-nav-link:hover {
  color: var(--text);
  transform: translateY(-1px);
}

.bottom-page-nav-link.is-active {
  color: var(--bg);
}

.bottom-page-nav-link:focus-visible {
  outline: 2px solid var(--accent-2);
  outline-offset: 2px;
}

.bottom-page-nav-link svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.bottom-page-nav-link.is-active svg {
  stroke-width: 1.9;
}

:global(:root[data-theme='dark']) .bottom-page-nav {
  border-color: rgba(255, 255, 255, 0.2);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.035) 48%, rgba(255, 255, 255, 0.09)),
    rgba(12, 12, 12, 0.46);
  box-shadow:
    0 16px 44px rgba(0, 0, 0, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    inset 0 -1px 0 rgba(255, 255, 255, 0.06);
}

@media (max-width: 560px) {
  .bottom-page-nav {
    --nav-item-size: 46px;
    --nav-item-step: 52px;

    bottom: max(12px, env(safe-area-inset-bottom));
  }
}

@media (prefers-reduced-motion: reduce) {
  .bottom-page-nav-indicator {
    transition-duration: 0.01ms;
  }
}
</style>
