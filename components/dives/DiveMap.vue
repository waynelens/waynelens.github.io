<script setup lang="ts">
import type { LayerGroup, Map as LeafletMap } from 'leaflet'

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
let markerLayer: LayerGroup | undefined
let leaflet: typeof import('leaflet') | undefined

const renderMarkers = () => {
  if (!leaflet || !map || !markerLayer) return

  markerLayer.clearLayers()

  for (const site of props.sites) {
    const selected = site.siteId === props.selectedSiteId
    const marker = leaflet.circleMarker([site.latitude, site.longitude], {
      radius: selected ? 11 : 8,
      weight: selected ? 3 : 2,
      color: selected ? '#ffffff' : '#f2c38b',
      fillColor: selected ? '#91b8ff' : '#f2c38b',
      fillOpacity: selected ? 0.95 : 0.82
    })

    marker.bindTooltip(`${site.name} · ${site.diveCount}`, {
      direction: 'top',
      offset: [0, -8]
    })
    marker.on('click', () => emit('select', site.siteId))
    marker.addTo(markerLayer)
  }
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

  leaflet = await import('leaflet')
  map = leaflet.map(mapElement.value, {
    scrollWheelZoom: false,
    zoomControl: true
  })

  leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map)

  markerLayer = leaflet.layerGroup().addTo(map)
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
    const site = props.sites.find(entry => entry.siteId === siteId)
    if (site && map) map.panTo([site.latitude, site.longitude])
  }
)

onBeforeUnmount(() => {
  map?.remove()
  map = undefined
  markerLayer = undefined
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

.dive-map :deep(.leaflet-control-attribution) {
  border-radius: 8px 0 0;
  font-family: var(--font-body);
  font-size: 0.64rem;
}

.dive-map :deep(.leaflet-tooltip) {
  border: 1px solid rgba(255, 255, 255, 0.38);
  border-radius: 999px;
  background: rgba(16, 16, 16, 0.78);
  color: #fff;
  font-family: var(--font-body);
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(14px);
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
