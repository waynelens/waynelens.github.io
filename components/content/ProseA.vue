<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  href?: string
  target?: '_blank' | '_parent' | '_self' | '_top' | (string & {}) | null
}>(), {
  href: ''
})

const linkHostname = computed(() => {
  if (!props.href) return ''

  try {
    return new URL(props.href).hostname.toLowerCase()
  } catch {
    return ''
  }
})

const isInstagramLink = computed(() => {
  const hostname = linkHostname.value
  return hostname === 'instagram.com' || hostname.endsWith('.instagram.com')
})

const isYouTubeLink = computed(() => {
  const hostname = linkHostname.value
  return hostname === 'youtu.be'
    || hostname.endsWith('.youtu.be')
    || hostname === 'youtube.com'
    || hostname.endsWith('.youtube.com')
    || hostname === 'youtube-nocookie.com'
    || hostname.endsWith('.youtube-nocookie.com')
})

const rel = computed(() => props.target === '_blank' ? 'noopener noreferrer' : undefined)
</script>

<template>
  <NuxtLink
    v-bind="$attrs"
    :href="props.href"
    :target="props.target"
    :rel="rel"
    class="prose-link"
    :class="{
      'prose-person-link': isInstagramLink,
      'prose-video-link': isYouTubeLink
    }"
  >
    <svg
      v-if="isInstagramLink"
      class="prose-person-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5.5 20c.65-4 3-6 6.5-6s5.85 2 6.5 6" />
    </svg>
    <svg
      v-else-if="isYouTubeLink"
      class="prose-video-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="m10.2 8.8 5 3.2-5 3.2z" />
    </svg>
    <span><slot /></span>
  </NuxtLink>
</template>

<style scoped>
.prose-link {
  color: color-mix(in srgb, var(--text) 82%, var(--accent-2));
  text-decoration-line: underline;
  text-decoration-color: color-mix(in srgb, var(--accent-2) 58%, transparent);
  text-decoration-thickness: 0.08em;
  text-underline-offset: 0.18em;
  transition:
    color 160ms ease,
    text-decoration-color 160ms ease;
}

.prose-link:hover {
  color: var(--text);
  text-decoration-color: var(--accent-2);
}

.prose-link:focus-visible {
  border-radius: 0.28rem;
  outline: 2px solid var(--accent-2);
  outline-offset: 3px;
}

.prose-person-link {
  display: inline-flex;
  align-items: center;
  gap: 0.28em;
  margin-inline: 0.04em;
  padding: 0.06em 0.38em 0.1em;
  border: 1px solid var(--line);
  border-radius: 0.5rem;
  background: var(--bg-soft);
  color: var(--muted);
  font-size: 0.95em;
  line-height: 1.45;
  text-decoration: none;
  vertical-align: 0.04em;
  transition:
    color 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease;
}

.prose-person-link:hover {
  border-color: color-mix(in srgb, var(--accent-2) 48%, var(--line));
  background: color-mix(in srgb, var(--accent-2) 9%, var(--bg-soft));
  color: var(--text);
}

.prose-video-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25em;
  color: var(--muted);
  text-decoration-color: color-mix(in srgb, var(--muted) 55%, transparent);
  vertical-align: baseline;
}

.prose-video-link:hover {
  color: var(--text);
  text-decoration-color: var(--accent-2);
}

.prose-person-icon {
  width: 0.95em;
  height: 0.95em;
  flex: 0 0 auto;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.prose-video-icon {
  width: 0.92em;
  height: 0.92em;
  flex: 0 0 auto;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.65;
}

.prose-video-icon path {
  fill: currentColor;
  stroke: none;
}

@media (prefers-reduced-motion: reduce) {
  .prose-link,
  .prose-person-link,
  .prose-video-link {
    transition: none;
  }
}
</style>
