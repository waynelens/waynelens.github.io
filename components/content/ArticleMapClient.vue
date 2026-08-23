<script setup lang="ts">
import type { LayerGroup, Map as LeafletMap, Marker, MarkerClusterGroup } from 'leaflet'
import type { ArticleMapLocation } from './ArticleMap.vue'

defineOptions({ name: 'ArticleMapClient' })

const props = defineProps<{
  locations: ArticleMapLocation[]
  zoom: number
  label: string
}>()

const { t } = useI18n()
const containerElement = ref<HTMLElement>()
const mapElement = ref<HTMLElement>()
const isLoading = ref(true)
const hasError = ref(false)
const initializationState = ref('idle')
const isCoarsePointer = ref(false)
const isInteractionEnabled = ref(true)

let map: LeafletMap | undefined
let markerLayer: LayerGroup | MarkerClusterGroup | undefined
let leaflet: typeof import('leaflet') | undefined
let intersectionObserver: IntersectionObserver | undefined
let resizeObserver: ResizeObserver | undefined
let isInitializing = false
let isUnmounted = false
let usesClustering = false
const markers: Marker[] = []

const createLocationIcon = (location: ArticleMapLocation) => {
  if (!leaflet) return

  return leaflet.divIcon({
    className: `article-map-marker${location.precision === 'approximate' ? ' is-approximate' : ''}`,
    html: '<span aria-hidden="true"></span>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12]
  })
}

const getSafeLink = (value: string | undefined) => {
  if (!value) return

  try {
    const url = new URL(value, window.location.origin)
    if (!['http:', 'https:'].includes(url.protocol)) return
    return url.href
  } catch {
    return undefined
  }
}

const createPopup = (location: ArticleMapLocation) => {
  const popup = document.createElement('div')
  popup.className = 'article-map-popup'

  const title = document.createElement('strong')
  title.textContent = location.name
  popup.append(title)

  if (location.precision === 'approximate') {
    const precision = document.createElement('span')
    precision.className = 'article-map-popup__precision'
    precision.textContent = t('articleMap.approximate')
    popup.append(precision)
  }

  if (location.description) {
    const description = document.createElement('p')
    description.textContent = location.description
    popup.append(description)
  }

  const href = getSafeLink(location.link)
  if (href) {
    const link = document.createElement('a')
    link.href = href
    link.textContent = t('articleMap.openLink')
    if (new URL(href).origin !== window.location.origin) {
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
    }
    popup.append(link)
  }

  return popup
}

const createMarkerLayer = () => {
  if (!leaflet || !map) return

  const shouldCluster = props.locations.length >= 8
  usesClustering = shouldCluster

  if (shouldCluster) {
    markerLayer = leaflet.markerClusterGroup({
      maxClusterRadius: 48,
      disableClusteringAtZoom: 15,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      removeOutsideVisibleBounds: true,
      chunkedLoading: true,
      iconCreateFunction: (cluster) => leaflet!.divIcon({
        className: 'article-map-cluster',
        html: `<span>${cluster.getChildCount()}</span>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      })
    })
  } else {
    markerLayer = leaflet.layerGroup()
  }

  markerLayer.addTo(map)
}

const renderMarkers = () => {
  if (!leaflet || !map || !markerLayer) return

  markerLayer.clearLayers()
  markers.splice(0)

  for (const location of props.locations) {
    const marker = leaflet.marker([location.latitude, location.longitude], {
      icon: createLocationIcon(location),
      title: location.name,
      alt: location.name,
      riseOnHover: true
    })

    marker.bindPopup(createPopup(location), {
      closeButton: true,
      maxWidth: 280
    })
    markers.push(marker)
  }

  markerLayer.addLayer(leaflet.layerGroup(markers))
}

const fitLocations = () => {
  if (!leaflet || !map || !props.locations.length) return

  if (props.locations.length === 1) {
    const location = props.locations[0]
    if (location) map.setView([location.latitude, location.longitude], props.zoom)
    return
  }

  map.fitBounds(
    leaflet.latLngBounds(props.locations.map(location => [location.latitude, location.longitude])),
    { padding: [38, 38], maxZoom: Math.min(props.zoom, 16) }
  )
}

const setInteraction = (enabled: boolean) => {
  isInteractionEnabled.value = enabled
  if (!map) return

  if (enabled) {
    map.dragging.enable()
    map.touchZoom.enable()
    map.doubleClickZoom.enable()
  } else {
    map.dragging.disable()
    map.touchZoom.disable()
    map.doubleClickZoom.disable()
  }
}

const initializeMap = async () => {
  if (isInitializing || map || !mapElement.value) return
  isInitializing = true
  initializationState.value = 'loading-leaflet'

  try {
    const leafletModule = await import('leaflet')
    initializationState.value = 'loading-clusters'
    await import('leaflet.markercluster')
    if (isUnmounted || !mapElement.value) return

    initializationState.value = 'creating-map'
    leaflet = (window as unknown as { L?: typeof import('leaflet') }).L || leafletModule
    isCoarsePointer.value = window.matchMedia('(pointer: coarse)').matches
    isInteractionEnabled.value = !isCoarsePointer.value

    map = leaflet.map(mapElement.value, {
      scrollWheelZoom: false,
      dragging: isInteractionEnabled.value,
      touchZoom: isInteractionEnabled.value,
      doubleClickZoom: isInteractionEnabled.value,
      zoomControl: true
    })

    leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    createMarkerLayer()
    renderMarkers()
    fitLocations()

    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => map?.invalidateSize())
      resizeObserver.observe(mapElement.value)
    }

    if ('requestAnimationFrame' in window) {
      requestAnimationFrame(() => map?.invalidateSize())
    } else {
      map.invalidateSize()
    }

    initializationState.value = 'ready'
    isLoading.value = false
  } catch (error) {
    console.error('Unable to initialize article map', error)
    initializationState.value = 'error'
    hasError.value = true
    isLoading.value = false
  } finally {
    isInitializing = false
  }
}

onMounted(() => {
  if (!containerElement.value) return

  if (!('IntersectionObserver' in window)) {
    initializationState.value = 'visible'
    void initializeMap()
    return
  }

  intersectionObserver = new IntersectionObserver((entries) => {
    if (!entries.some(entry => entry.isIntersecting)) return
    intersectionObserver?.disconnect()
    intersectionObserver = undefined
    initializationState.value = 'visible'
    void initializeMap()
  }, { rootMargin: '320px 0px' })

  intersectionObserver.observe(containerElement.value)
})

watch(
  () => props.locations,
  () => {
    if (!map || !leaflet) return

    const shouldCluster = props.locations.length >= 8
    if (shouldCluster !== usesClustering) {
      if (markerLayer) map.removeLayer(markerLayer)
      markerLayer = undefined
      createMarkerLayer()
    }

    renderMarkers()
    fitLocations()
  },
  { deep: true }
)

watch(() => props.zoom, fitLocations)

onBeforeUnmount(() => {
  isUnmounted = true
  intersectionObserver?.disconnect()
  resizeObserver?.disconnect()
  map?.remove()
  map = undefined
  markerLayer = undefined
  markers.splice(0)
})
</script>

<template>
  <div
    ref="containerElement"
    class="article-map-client"
    :data-map-state="initializationState"
  >
    <div
      ref="mapElement"
      class="article-map-client__canvas"
      role="region"
      :aria-label="label"
    />

    <p v-if="isLoading" class="article-map-client__status" role="status">
      {{ t('articleMap.loading') }}
    </p>
    <p v-else-if="hasError" class="article-map-client__status" role="alert">
      {{ t('articleMap.unavailable') }}
    </p>

    <button
      v-if="isCoarsePointer && !isInteractionEnabled && !isLoading && !hasError"
      type="button"
      class="article-map-client__interaction"
      @click="setInteraction(true)"
    >
      {{ t('articleMap.enableInteraction') }}
    </button>
    <button
      v-else-if="isCoarsePointer && isInteractionEnabled && !isLoading && !hasError"
      type="button"
      class="article-map-client__interaction is-active"
      @click="setInteraction(false)"
    >
      {{ t('articleMap.disableInteraction') }}
    </button>
  </div>
</template>

<style scoped>
.article-map-client {
  position: relative;
  width: 100%;
  height: var(--article-map-height, 420px);
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--bg-soft);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text) 3%, transparent);
}

.article-map-client__canvas {
  width: 100%;
  height: 100%;
}

.article-map-client__status {
  position: absolute;
  inset: 0;
  display: grid;
  margin: 0;
  background: var(--bg-soft);
  color: var(--muted);
  place-items: center;
  pointer-events: none;
}

.article-map-client__interaction {
  position: absolute;
  z-index: 500;
  right: 12px;
  bottom: 28px;
  padding: 0.58rem 0.82rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: color-mix(in srgb, var(--bg-elevated) 92%, transparent);
  color: var(--text);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  font-size: 0.76rem;
  cursor: pointer;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.article-map-client__interaction.is-active {
  background: color-mix(in srgb, var(--accent-2) 24%, var(--bg-elevated));
}

.article-map-client :deep(.leaflet-tile-pane) {
  filter: none;
  transition: filter 240ms ease;
}

:global(:root[data-theme='dark'] .article-map-client .leaflet-tile-pane) {
  filter: invert(1) hue-rotate(180deg) brightness(0.72) contrast(0.9) saturate(0.62);
}

.article-map-client :deep(.leaflet-control-zoom a),
.article-map-client :deep(.leaflet-control-attribution),
.article-map-client :deep(.leaflet-popup-content-wrapper),
.article-map-client :deep(.leaflet-popup-tip) {
  border-color: var(--line);
  background: color-mix(in srgb, var(--bg-elevated) 94%, transparent);
  color: var(--text);
}

.article-map-client :deep(.leaflet-control-zoom a),
.article-map-client :deep(.leaflet-control-attribution),
.article-map-client :deep(.leaflet-popup-content-wrapper) {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.article-map-client :deep(.leaflet-control-zoom a:hover) {
  background: var(--bg-soft);
  color: var(--text);
}

.article-map-client :deep(.leaflet-control-attribution) {
  border-radius: 8px 0 0;
  font-family: var(--font-body);
  font-size: 0.64rem;
}

.article-map-client :deep(.leaflet-control-attribution a),
.article-map-client :deep(.leaflet-popup-content a) {
  color: var(--text);
  text-decoration: underline;
  text-underline-offset: 0.18em;
}

.article-map-client :deep(.leaflet-popup-content-wrapper) {
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.26);
}

.article-map-client :deep(.leaflet-popup-content) {
  display: grid;
  gap: 0.45rem;
  min-width: 150px;
  margin: 14px 16px;
  font-family: var(--font-body);
  line-height: 1.5;
}

.article-map-client :deep(.article-map-popup strong),
.article-map-client :deep(.article-map-popup p),
.article-map-client :deep(.article-map-popup a),
.article-map-client :deep(.article-map-popup__precision) {
  display: block;
}

.article-map-client :deep(.article-map-popup p) {
  margin: 0.4rem 0;
}

.article-map-client :deep(.article-map-popup__precision) {
  color: var(--muted);
  font-size: 0.72rem;
}

.article-map-client :deep(.leaflet-popup-close-button) {
  color: var(--muted);
}

.article-map-client :deep(.article-map-marker) {
  display: grid;
  border: 0;
  background: transparent;
  place-items: center;
}

.article-map-client :deep(.article-map-marker span) {
  display: block;
  width: 100%;
  height: 100%;
  border: 2px solid rgba(255, 255, 255, 0.94);
  border-radius: 50%;
  background: var(--accent-2);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.34);
}

.article-map-client :deep(.article-map-marker.is-approximate span) {
  border-style: dashed;
  background: var(--accent);
}

.article-map-client :deep(.article-map-cluster) {
  display: grid;
  border: 0;
  border-radius: 50%;
  background: color-mix(in srgb, var(--bg-elevated) 78%, transparent);
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--accent-2) 20%, transparent), 0 8px 24px rgba(0, 0, 0, 0.3);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 0.78rem;
  font-weight: 650;
  place-items: center;
  backdrop-filter: blur(14px);
}

.article-map-client :deep(.article-map-cluster span) {
  display: grid;
  width: calc(100% - 4px);
  height: calc(100% - 4px);
  border: 1px solid color-mix(in srgb, var(--text) 22%, transparent);
  border-radius: 50%;
  place-items: center;
}

@media (max-width: 640px) {
  .article-map-client {
    height: min(var(--article-map-height, 420px), 300px);
    border-radius: 16px;
  }
}
</style>
