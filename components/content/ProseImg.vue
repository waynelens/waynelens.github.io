<script setup lang="ts">
defineOptions({ inheritAttrs: false })

defineProps<{
  src?: string
  alt?: string
  width?: number | string
  height?: number | string
}>()
</script>

<template>
  <ResponsiveImage
    v-if="src"
    v-bind="$attrs"
    :src="src"
    :alt="alt || ''"
    :width="width"
    :height="height"
    :default-width="1200"
    sizes="(max-width: 760px) calc(100vw - 44px), 1100px"
  />
</template>
