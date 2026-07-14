<script setup lang="ts">
import {
  DEFAULT_IMAGE_QUALITY,
  IMAGE_WIDTHS,
  getImageSrcset,
  getImageVariant,
  isTransformableImage
} from '~/shared/utils/image'
import type { ImageWidth } from '~/shared/utils/image'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  src: string
  alt: string
  sizes: string
  widths?: readonly ImageWidth[]
  defaultWidth?: ImageWidth
  quality?: number
  loading?: 'eager' | 'lazy'
  fetchPriority?: 'auto' | 'high' | 'low'
}>(), {
  widths: () => IMAGE_WIDTHS,
  defaultWidth: 768,
  quality: DEFAULT_IMAGE_QUALITY,
  loading: 'lazy',
  fetchPriority: 'auto'
})

const useOriginal = ref(false)

watch(() => props.src, () => {
  useOriginal.value = false
})

const canTransform = computed(() => isTransformableImage(props.src))
const transformedSrc = computed(() => getImageVariant(props.src, props.defaultWidth, props.quality))
const transformedSrcset = computed(() => getImageSrcset(props.src, props.widths, props.quality))
const resolvedSrc = computed(() => (
  useOriginal.value || !canTransform.value ? props.src : transformedSrc.value
))
const resolvedSrcset = computed(() => (
  useOriginal.value || !canTransform.value ? undefined : transformedSrcset.value
))
const resolvedSizes = computed(() => resolvedSrcset.value ? props.sizes : undefined)

const handleError = () => {
  if (useOriginal.value || !canTransform.value) return
  useOriginal.value = true
}
</script>

<template>
  <img
    v-bind="$attrs"
    :src="resolvedSrc"
    :srcset="resolvedSrcset"
    :sizes="resolvedSizes"
    :alt="alt"
    :loading="loading"
    decoding="async"
    :fetchpriority="fetchPriority"
    @error="handleError"
  >
</template>
