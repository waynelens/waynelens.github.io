<script setup lang="ts">
type ArticleMapLocationInput = {
  name?: string
  latitude?: number | string
  longitude?: number | string
  description?: string
  precision?: 'exact' | 'approximate'
  link?: string
}

export type ArticleMapLocation = {
  name: string
  latitude: number
  longitude: number
  description?: string
  precision: 'exact' | 'approximate'
  link?: string
}

const props = withDefaults(defineProps<{
  locations?: ArticleMapLocationInput[]
  zoom?: number | string
  height?: number | string
  caption?: string
}>(), {
  locations: () => [],
  zoom: 14,
  height: 420,
  caption: ''
})

const { t } = useI18n()

const toFiniteNumber = (value: number | string | undefined) => {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? number : undefined
}

const locations = computed<ArticleMapLocation[]>(() => props.locations.flatMap((location, index) => {
  const latitude = toFiniteNumber(location?.latitude)
  const longitude = toFiniteNumber(location?.longitude)

  if (
    latitude === undefined
    || longitude === undefined
    || latitude < -90
    || latitude > 90
    || longitude < -180
    || longitude > 180
  ) {
    return []
  }

  return [{
    name: location.name?.trim() || `${t('articleMap.location')} ${index + 1}`,
    latitude,
    longitude,
    description: location.description?.trim() || undefined,
    precision: location.precision === 'approximate' ? 'approximate' : 'exact',
    link: location.link?.trim() || undefined
  }]
}))

const zoom = computed(() => {
  const value = toFiniteNumber(props.zoom) ?? 14
  return Math.min(19, Math.max(2, Math.round(value)))
})

const height = computed(() => {
  const value = toFiniteNumber(props.height) ?? 420
  return `${Math.min(760, Math.max(240, Math.round(value)))}px`
})

const mapLabel = computed(() => props.caption || t('articleMap.label'))
</script>

<template>
  <figure class="article-map" :style="{ '--article-map-height': height }">
    <ArticleMapClient
      v-if="locations.length"
      :locations="locations"
      :zoom="zoom"
      :label="mapLabel"
    />
    <p v-else class="article-map__empty" role="status">
      {{ t('articleMap.unavailable') }}
    </p>

    <figcaption v-if="caption" class="article-map__caption">
      {{ caption }}
    </figcaption>
  </figure>
</template>

<style scoped>
.article-map {
  width: 100%;
  margin: 1.75rem 0;
}

.article-map__empty {
  display: grid;
  min-height: min(var(--article-map-height), 300px);
  margin: 0;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--bg-soft);
  color: var(--muted);
  place-items: center;
}

.article-map__caption {
  margin-top: 0.7rem;
  color: var(--muted);
  font-size: 0.86rem;
  line-height: 1.6;
  text-align: center;
}
</style>
