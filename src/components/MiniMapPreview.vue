<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getItems, type Item, type ItemStatus, type ItemType } from '../services/itemService'
import { geocodeLocation } from '../services/geoCodingService'
import {
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_MAX_ZOOM,
  hasValidCoordinates,
} from '../config/mapConfig'

interface PreviewItem extends Item {
  latitudeForMap: number
  longitudeForMap: number
}

const MAX_PREVIEW_GEOCODING_ITEMS = 6

const mapContainer = ref<HTMLDivElement | null>(null)
const previewItems = ref<PreviewItem[]>([])
const isLoading = ref(false)

let leafletMap: L.Map | null = null
let markerGroup: L.LayerGroup | null = null

async function loadPreviewItems() {
  isLoading.value = true

  try {
    const items = await getItems()
    const activeItems = items.filter((item) => item.status !== 'RETURNED').slice(0, 6)

    const convertedItems: PreviewItem[] = []
    let geocodingCount = 0

    for (const item of activeItems) {
      if (hasValidCoordinates(item.latitude, item.longitude)) {
        convertedItems.push({
          ...item,
          latitudeForMap: item.latitude as number,
          longitudeForMap: item.longitude as number,
        })

        continue
      }

      if (geocodingCount < MAX_PREVIEW_GEOCODING_ITEMS && item.location.trim().length >= 3) {
        geocodingCount += 1

        const geocodingResults = await geocodeLocation(item.location, 1)
        const firstResult = geocodingResults[0]

        if (firstResult) {
          convertedItems.push({
            ...item,
            latitudeForMap: firstResult.latitude,
            longitudeForMap: firstResult.longitude,
          })
        }
      }
    }

    previewItems.value = convertedItems
  } catch (error) {
    console.error(error)
    previewItems.value = []
  } finally {
    isLoading.value = false
  }
}

function initializeMap() {
  if (!mapContainer.value || leafletMap) {
    return
  }

  leafletMap = L.map(mapContainer.value, {
    center: [MAP_DEFAULT_CENTER.latitude, MAP_DEFAULT_CENTER.longitude],
    zoom: MAP_DEFAULT_ZOOM,
    zoomControl: false,
    attributionControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: MAP_MAX_ZOOM,
  }).addTo(leafletMap)

  markerGroup = L.layerGroup().addTo(leafletMap)
}

function renderMarkers() {
  if (!leafletMap || !markerGroup) {
    return
  }

  markerGroup.clearLayers()

  const bounds: L.LatLngExpression[] = []

  previewItems.value.forEach((item) => {
    const position: L.LatLngExpression = [item.latitudeForMap, item.longitudeForMap]

    bounds.push(position)

    const marker = L.marker(position, {
      icon: createMarkerIcon(item.type, item.status),
      title: item.title,
    })

    marker.addTo(markerGroup as L.LayerGroup)
  })

  if (bounds.length > 0) {
    leafletMap.fitBounds(L.latLngBounds(bounds), {
      padding: [32, 32],
      maxZoom: 17,
    })
  }
}

function createMarkerIcon(type: ItemType, status: ItemStatus) {
  const markerClass = [
    'mini-map-marker',
    type === 'FOUND' ? 'found' : 'lost',
    status === 'RETURNED' ? 'returned' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const symbol = type === 'FOUND' ? '✓' : '!'

  return L.divIcon({
    className: markerClass,
    html: `
      <div class="mini-marker-shell">
        <div class="mini-marker-icon">${symbol}</div>
        <div class="mini-marker-tail"></div>
      </div>
    `,
    iconSize: [34, 44],
    iconAnchor: [17, 42],
  })
}

onMounted(async () => {
  initializeMap()
  await loadPreviewItems()
  await nextTick()
  renderMarkers()
})

onBeforeUnmount(() => {
  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
    markerGroup = null
  }
})
</script>

<template>
  <div class="mini-map-shell">
    <div ref="mapContainer" class="mini-map"></div>

    <div v-if="isLoading" class="mini-map-loading">
      Karte wird geladen...
    </div>

    <RouterLink to="/map" class="mini-map-link">
      Karte öffnen
    </RouterLink>
  </div>
</template>

<style scoped>
.mini-map-shell {
  position: relative;
  min-height: 280px;
  overflow: hidden;
  background: #eff6ff;
}

.mini-map {
  width: 100%;
  height: 280px;
  filter: saturate(0.9) contrast(0.98);
}

.mini-map-loading {
  position: absolute;
  inset: 22px auto auto 22px;
  padding: 8px 12px;
  border-radius: 999px;
  background: white;
  color: var(--muted);
  font-weight: 900;
  box-shadow: var(--shadow-sm);
}

.mini-map-link {
  position: absolute;
  right: 18px;
  bottom: 18px;
  padding: 10px 14px;
  border-radius: 999px;
  background: white;
  color: var(--primary);
  font-weight: 900;
  text-decoration: none;
  box-shadow: var(--shadow-sm);
}

.mini-map-link:hover {
  background: #eff6ff;
}

:global(.mini-map-marker) {
  border: none;
  background: transparent;
}

:global(.mini-marker-shell) {
  width: 34px;
  height: 44px;
  position: relative;
  display: grid;
  place-items: center;
}

:global(.mini-marker-icon) {
  position: relative;
  z-index: 2;
  width: 29px;
  height: 29px;
  display: grid;
  place-items: center;
  border: 2px solid white;
  border-radius: 13px;
  background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
  color: white;
  font-size: 0.9rem;
  font-weight: 900;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.25);
}

:global(.mini-marker-tail) {
  position: absolute;
  z-index: 1;
  bottom: 6px;
  width: 15px;
  height: 15px;
  border-right: 2px solid white;
  border-bottom: 2px solid white;
  border-radius: 0 0 5px 0;
  background: #b91c1c;
  transform: rotate(45deg);
}

:global(.mini-map-marker.found .mini-marker-icon) {
  background: linear-gradient(135deg, #22c55e 0%, #15803d 100%);
}

:global(.mini-map-marker.found .mini-marker-tail) {
  background: #15803d;
}

:global(.mini-map-marker.returned .mini-marker-icon) {
  background: linear-gradient(135deg, #94a3b8 0%, #475569 100%);
}

:global(.mini-map-marker.returned .mini-marker-tail) {
  background: #475569;
}
</style>