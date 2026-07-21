<script setup lang="ts">
import type { Map as LeafletMap, Marker, MarkerClusterGroup } from 'leaflet'

export type DiveMapSite = {
  siteId: string
  name: string
  latitude: number
  longitude: number
  diveCount: number
}

const props = defineProps<{
  sites: DiveMapSite[]
  selectedSiteId?: string
  ariaLabel: string
}>()

const emit = defineEmits<{
  select: [siteId: string]
}>()

const mapElement = ref<HTMLElement>()
let map: LeafletMap | undefined
let markerLayer: MarkerClusterGroup | undefined
let leaflet: typeof import('leaflet') | undefined
const siteMarkers = new Map<string, Marker>()

const createSiteIcon = (selected: boolean) => {
  if (!leaflet) return

  const size = selected ? 22 : 16

  return leaflet.divIcon({
    className: `dive-site-marker${selected ? ' is-selected' : ''}`,
    html: '<span aria-hidden="true"></span>',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  })
}

const renderMarkers = () => {
  if (!leaflet || !map || !markerLayer) return

  markerLayer.clearLayers()
  siteMarkers.clear()

  for (const site of props.sites) {
    const selected = site.siteId === props.selectedSiteId
    const marker = leaflet.marker([site.latitude, site.longitude], {
      icon: createSiteIcon(selected),
      title: site.name,
      alt: site.name,
      riseOnHover: true
    })

    marker.bindTooltip(`${site.name} · ${site.diveCount}`, {
      direction: 'top',
      offset: [0, -8]
    })
    marker.on('click', () => emit('select', site.siteId))
    siteMarkers.set(site.siteId, marker)
  }

  markerLayer.addLayers([...siteMarkers.values()])
}

const fitSites = () => {
  if (!leaflet || !map || !props.sites.length) return

  if (props.sites.length === 1) {
    map.setView([props.sites[0].latitude, props.sites[0].longitude], 12)
    return
  }

  map.fitBounds(
    leaflet.latLngBounds(props.sites.map(site => [site.latitude, site.longitude])),
    { padding: [36, 36], maxZoom: 12 }
  )
}

onMounted(async () => {
  if (!mapElement.value) return

  const leafletModule = await import('leaflet')
  await import('leaflet.markercluster')
  leaflet = (window as unknown as { L?: typeof import('leaflet') }).L || leafletModule
  map = leaflet.map(mapElement.value, {
    scrollWheelZoom: false,
    zoomControl: true
  })

  leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map)

  markerLayer = leaflet.markerClusterGroup({
    maxClusterRadius: 52,
    disableClusteringAtZoom: 13,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    spiderfyOnMaxZoom: true,
    removeOutsideVisibleBounds: true,
    chunkedLoading: true,
    iconCreateFunction: (cluster) => {
      const count = cluster.getChildCount()
      const size = count >= 100 ? 54 : count >= 10 ? 48 : 42

      return leaflet!.divIcon({
        className: 'dive-marker-cluster',
        html: `<span>${count}</span>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      })
    }
  }).addTo(map)
  renderMarkers()
  fitSites()
  requestAnimationFrame(() => map?.invalidateSize())
})

watch(
  () => props.sites,
  () => {
    renderMarkers()
    fitSites()
  },
  { deep: true }
)

watch(
  () => props.selectedSiteId,
  (siteId) => {
    renderMarkers()
    const marker = siteId ? siteMarkers.get(siteId) : undefined
    if (marker && markerLayer && map) {
      markerLayer.zoomToShowLayer(marker, () => map?.panTo(marker.getLatLng()))
    }
  }
)

onBeforeUnmount(() => {
  map?.remove()
  map = undefined
  markerLayer = undefined
  siteMarkers.clear()
})
</script>

<template>
  <div
    ref="mapElement"
    class="dive-map"
    role="region"
    :aria-label="ariaLabel"
  />
</template>

<style scoped>
.dive-map {
  width: 100%;
  min-height: 620px;
  border-radius: 24px;
  background: var(--bg-soft);
  box-shadow: inset 0 0 0 1px var(--line);
}

.dive-map :deep(.leaflet-tile-pane) {
  filter: none;
  transition: filter 240ms ease;
}

.dive-map :deep(.leaflet-control-zoom a),
.dive-map :deep(.leaflet-control-attribution) {
  border-color: var(--line);
  background: color-mix(in srgb, var(--bg-elevated) 92%, transparent);
  color: var(--text);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.dive-map :deep(.leaflet-control-zoom a:hover) {
  background: var(--bg-soft);
  color: var(--text);
}

.dive-map :deep(.leaflet-control-attribution a) {
  color: var(--text);
}

.dive-map :deep(.leaflet-control-attribution) {
  border-radius: 8px 0 0;
  font-family: var(--font-body);
  font-size: 0.64rem;
}

.dive-map :deep(.leaflet-tooltip) {
  border: 1px solid var(--line);
  border-radius: 999px;
  background: color-mix(in srgb, var(--bg-elevated) 88%, transparent);
  color: var(--text);
  font-family: var(--font-body);
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.dive-map :deep(.leaflet-tooltip::before) {
  border-top-color: var(--line);
}

:global(:root[data-theme='dark'] .dive-map .leaflet-tile-pane) {
  filter: invert(1) hue-rotate(180deg) brightness(0.72) contrast(0.9) saturate(0.62);
}

.dive-map :deep(.dive-site-marker) {
  display: grid;
  border: 0;
  background: transparent;
  place-items: center;
}

.dive-map :deep(.dive-site-marker span) {
  display: block;
  width: 100%;
  height: 100%;
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  background: #f2c38b;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.34);
}

.dive-map :deep(.dive-site-marker.is-selected span) {
  border-width: 3px;
  background: #91b8ff;
  box-shadow: 0 0 0 4px rgba(145, 184, 255, 0.2), 0 5px 18px rgba(0, 0, 0, 0.38);
}

.dive-map :deep(.dive-marker-cluster) {
  display: grid;
  border: 0;
  border-radius: 50%;
  background: color-mix(in srgb, var(--bg-elevated) 74%, transparent);
  box-shadow: 0 0 0 5px color-mix(in srgb, #91b8ff 18%, transparent), 0 8px 24px rgba(0, 0, 0, 0.3);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 0.78rem;
  font-weight: 650;
  place-items: center;
  backdrop-filter: blur(14px);
}

.dive-map :deep(.dive-marker-cluster span) {
  display: grid;
  width: calc(100% - 4px);
  height: calc(100% - 4px);
  border: 1px solid color-mix(in srgb, var(--text) 22%, transparent);
  border-radius: 50%;
  place-items: center;
}

@media (max-width: 920px) {
  .dive-map {
    min-height: min(58vh, 520px);
  }
}

@media (max-width: 560px) {
  .dive-map {
    min-height: 52vh;
    border-radius: 18px;
  }
}
</style>
