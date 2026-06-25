<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getItems, type Item, type ItemStatus, type ItemType } from '../services/itemService'
import {
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  getCoordinateKey,
  getMarkerOffset,
  hasValidCoordinates,
} from '../config/mapConfig'

interface MapItem extends Item {
  hasCoordinates: boolean
  markerLatitude: number | null
  markerLongitude: number | null
}

const router = useRouter()

const mapCenter: L.LatLngExpression = [
  MAP_DEFAULT_CENTER.latitude,
  MAP_DEFAULT_CENTER.longitude,
]

const items = ref<MapItem[]>([])
const isLoading = ref(false)
const errorMessage = ref('')
const selectedType = ref<'ALL' | ItemType>('ALL')
const selectedStatus = ref<'ALL' | ItemStatus>('ALL')
const mapContainer = ref<HTMLDivElement | null>(null)
const activeItemId = ref<number | null>(null)

let leafletMap: L.Map | null = null
let markerGroup: L.LayerGroup | null = null
let markersByItemId = new Map<number, L.Marker>()

const visibleItems = computed(() => {
  return items.value.filter((item) => {
    const matchesType = selectedType.value === 'ALL' || item.type === selectedType.value
    const matchesStatus = selectedStatus.value === 'ALL' || item.status === selectedStatus.value

    return matchesType && matchesStatus
  })
})

const visibleItemsWithMarkers = computed(() => {
  return visibleItems.value.filter((item) => item.hasCoordinates)
})

const itemsWithoutCoordinates = computed(() => {
  return visibleItems.value.filter((item) => !item.hasCoordinates)
})

const openItemsCount = computed(() => {
  return items.value.filter((item) => item.status !== 'RETURNED').length
})

async function loadItems() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const loadedItems = await getItems()
    const convertedItems = loadedItems.map(toMapItem)

    items.value = applyMarkerOffsets(convertedItems)
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Die Kartendaten konnten nicht geladen werden.'
  } finally {
    isLoading.value = false
  }
}

function toMapItem(item: Item): MapItem {
  if (hasValidCoordinates(item.latitude, item.longitude)) {
    return {
      ...item,
      hasCoordinates: true,
      markerLatitude: item.latitude,
      markerLongitude: item.longitude,
    }
  }

  return {
    ...item,
    hasCoordinates: false,
    markerLatitude: null,
    markerLongitude: null,
  }
}

function applyMarkerOffsets(mapItems: MapItem[]) {
  const groups = new Map<string, MapItem[]>()

  mapItems.forEach((item) => {
    if (!item.hasCoordinates || item.latitude === null || item.longitude === null) {
      return
    }

    const key = getCoordinateKey(item.latitude, item.longitude)
    const group = groups.get(key) ?? []

    group.push(item)
    groups.set(key, group)
  })

  groups.forEach((group) => {
    if (group.length <= 1) {
      return
    }

    group.forEach((item, index) => {
      if (item.latitude === null || item.longitude === null) {
        return
      }

      const offset = getMarkerOffset(index, group.length)

      item.markerLatitude = item.latitude + offset.latitude
      item.markerLongitude = item.longitude + offset.longitude
    })
  })

  return mapItems
}

function initializeMap() {
  if (!mapContainer.value || leafletMap) {
    return
  }

  leafletMap = L.map(mapContainer.value, {
    center: mapCenter,
    zoom: MAP_DEFAULT_ZOOM,
    minZoom: MAP_MIN_ZOOM,
    maxZoom: MAP_MAX_ZOOM,
    scrollWheelZoom: true,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: MAP_MAX_ZOOM,
    attribution: '&copy; OpenStreetMap-Mitwirkende',
  }).addTo(leafletMap)

  markerGroup = L.layerGroup().addTo(leafletMap)
}

function renderMarkers() {
  if (!leafletMap || !markerGroup) {
    return
  }

  markerGroup.clearLayers()
  markersByItemId = new Map<number, L.Marker>()

  const markerBounds: L.LatLngExpression[] = []

  visibleItemsWithMarkers.value.forEach((item) => {
    if (item.markerLatitude === null || item.markerLongitude === null) {
      return
    }

    const markerPosition: L.LatLngExpression = [item.markerLatitude, item.markerLongitude]

    markerBounds.push(markerPosition)

    const marker = L.marker(markerPosition, {
      icon: createMarkerIcon(item.type, item.status),
      title: item.title,
      riseOnHover: true,
    })

    marker.bindPopup(createPopupHtml(item), {
      maxWidth: 300,
      className: 'findit-popup',
    })

    marker.on('click', () => {
      activeItemId.value = item.id
    })

    marker.on('popupopen', () => {
      const popupElement = marker.getPopup()?.getElement()
      const detailsLink = popupElement?.querySelector<HTMLAnchorElement>('[data-item-details-link]')

      detailsLink?.addEventListener(
        'click',
        (event) => {
          event.preventDefault()
          router.push(`/items/${item.id}`)
        },
        { once: true },
      )
    })

    marker.addTo(markerGroup as L.LayerGroup)
    markersByItemId.set(item.id, marker)
  })

  if (markerBounds.length > 0) {
    leafletMap.fitBounds(L.latLngBounds(markerBounds), {
      padding: [48, 48],
      maxZoom: 18,
    })
  } else {
    leafletMap.setView(mapCenter, MAP_DEFAULT_ZOOM)
  }
}

function createMarkerIcon(type: ItemType, status: ItemStatus) {
  const markerClass = [
    'findit-map-marker',
    type === 'FOUND' ? 'found' : 'lost',
    status === 'RETURNED' ? 'returned' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const symbol = type === 'FOUND' ? '✓' : '!'

  return L.divIcon({
    className: markerClass,
    html: `
      <div class="findit-marker-shell">
        <div class="findit-marker-icon">${symbol}</div>
        <div class="findit-marker-tail"></div>
      </div>
    `,
    iconSize: [42, 54],
    iconAnchor: [21, 52],
    popupAnchor: [0, -46],
  })
}

function createPopupHtml(item: MapItem) {
  const typeLabel = item.type === 'FOUND' ? 'Gefunden' : 'Verloren'
  const statusLabel = getStatusLabel(item.status)

  return `
    <article class="findit-popup-card">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${typeLabel} · ${statusLabel}</span>
      <p>${escapeHtml(item.location)} · ${escapeHtml(item.category)}</p>
      <a href="#" data-item-details-link="${item.id}">Details öffnen</a>
    </article>
  `
}

function focusItem(item: MapItem) {
  if (!leafletMap || !item.hasCoordinates || item.markerLatitude === null || item.markerLongitude === null) {
    return
  }

  activeItemId.value = item.id

  leafletMap.setView([item.markerLatitude, item.markerLongitude], 18, {
    animate: true,
  })

  const marker = markersByItemId.get(item.id)

  if (marker) {
    marker.openPopup()
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function getTypeLabel(type: ItemType) {
  return type === 'FOUND' ? 'Gefunden' : 'Verloren'
}

function getStatusLabel(status: ItemStatus) {
  const labels: Record<ItemStatus, string> = {
    OPEN: 'Offen',
    IN_PROGRESS: 'In Klärung',
    RETURNED: 'Zurückgegeben',
  }

  return labels[status]
}

watch(
  [visibleItems, selectedType, selectedStatus],
  async () => {
    await nextTick()
    renderMarkers()
  },
  { deep: true },
)

onMounted(async () => {
  initializeMap()
  await loadItems()
  await nextTick()
  renderMarkers()
})

onBeforeUnmount(() => {
  if (leafletMap) {
    leafletMap.remove()
    leafletMap = null
    markerGroup = null
    markersByItemId = new Map<number, L.Marker>()
  }
})
</script>

<template>
  <section class="page-section map-page">
    <div class="container map-layout">
      <div class="map-header">
        <div>
          <p class="eyebrow">Campuskarte</p>
          <h1 class="section-title">Fundorte und Verlustorte auf der Karte</h1>
          <p class="section-subtitle">
            Die Karte zeigt Einträge mit gespeicherter Kartenposition. Neue Meldungen erhalten ihre
            Position über die Ortssuche im Meldeformular.
          </p>
        </div>

        <RouterLink to="/items/new" class="btn-primary">Gegenstand melden</RouterLink>
      </div>

      <div class="map-stats">
        <article>
          <strong>{{ items.length }}</strong>
          <span>Einträge gesamt</span>
        </article>

        <article>
          <strong>{{ openItemsCount }}</strong>
          <span>Aktive Einträge</span>
        </article>

        <article>
          <strong>{{ visibleItemsWithMarkers.length }}</strong>
          <span>Mit Kartenposition</span>
        </article>
      </div>

      <div class="map-content">
        <aside class="card map-sidebar">
          <div class="filter-panel">
            <div class="filter-block">
              <span class="filter-title">Typ</span>

              <div class="filter-chips">
                <button
                  type="button"
                  class="filter-chip"
                  :class="{ active: selectedType === 'ALL' }"
                  @click="selectedType = 'ALL'"
                >
                  Alle
                </button>

                <button
                  type="button"
                  class="filter-chip found"
                  :class="{ active: selectedType === 'FOUND' }"
                  @click="selectedType = 'FOUND'"
                >
                  Gefunden
                </button>

                <button
                  type="button"
                  class="filter-chip lost"
                  :class="{ active: selectedType === 'LOST' }"
                  @click="selectedType = 'LOST'"
                >
                  Verloren
                </button>
              </div>
            </div>

            <div class="filter-block">
              <span class="filter-title">Status</span>

              <div class="filter-chips">
                <button
                  type="button"
                  class="filter-chip"
                  :class="{ active: selectedStatus === 'ALL' }"
                  @click="selectedStatus = 'ALL'"
                >
                  Alle
                </button>

                <button
                  type="button"
                  class="filter-chip"
                  :class="{ active: selectedStatus === 'OPEN' }"
                  @click="selectedStatus = 'OPEN'"
                >
                  Offen
                </button>

                <button
                  type="button"
                  class="filter-chip"
                  :class="{ active: selectedStatus === 'IN_PROGRESS' }"
                  @click="selectedStatus = 'IN_PROGRESS'"
                >
                  In Klärung
                </button>

                <button
                  type="button"
                  class="filter-chip"
                  :class="{ active: selectedStatus === 'RETURNED' }"
                  @click="selectedStatus = 'RETURNED'"
                >
                  Zurückgegeben
                </button>
              </div>
            </div>
          </div>

          <div v-if="isLoading" class="map-message">
            Kartendaten werden geladen...
          </div>

          <div v-else-if="errorMessage" class="map-error">
            {{ errorMessage }}
          </div>

          <div v-else class="map-item-list">
            <article
              v-for="item in visibleItems"
              :key="item.id"
              class="map-item"
              :class="{ active: activeItemId === item.id, muted: !item.hasCoordinates }"
            >
              <button
                type="button"
                class="map-item-main"
                :disabled="!item.hasCoordinates"
                @click="focusItem(item)"
              >
                <span
                  class="map-item-badge"
                  :class="{
                    found: item.type === 'FOUND',
                    lost: item.type === 'LOST',
                    returned: item.status === 'RETURNED',
                  }"
                >
                  {{ item.type === 'FOUND' ? '✓' : '!' }}
                </span>

                <span class="map-item-content">
                  <strong>{{ item.title }}</strong>
                  <span>
                    {{ getTypeLabel(item.type) }} · {{ getStatusLabel(item.status) }}
                  </span>
                  <small>{{ item.location }} · {{ item.category }}</small>
                  <small v-if="!item.hasCoordinates" class="source-warning">
                    Keine Kartenposition gespeichert
                  </small>
                </span>
              </button>

              <RouterLink :to="`/items/${item.id}`" class="map-item-link">
                Details
              </RouterLink>
            </article>

            <p v-if="visibleItems.length === 0" class="empty-list">
              Keine passenden Einträge gefunden.
            </p>
          </div>

          <div v-if="itemsWithoutCoordinates.length > 0" class="missing-position-hint">
            {{ itemsWithoutCoordinates.length }} sichtbare Einträge haben noch keine gespeicherte
            Kartenposition.
          </div>
        </aside>

        <div class="card map-card">
          <div ref="mapContainer" class="map-container"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.map-page {
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.1), transparent 28%),
    linear-gradient(135deg, #f8fafc 0%, #ffffff 48%, #eff6ff 100%);
}

.map-layout {
  display: grid;
  gap: 28px;
}

.map-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.eyebrow {
  margin: 0 0 10px;
  color: var(--accent);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.map-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.map-stats article {
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: white;
  box-shadow: var(--shadow-sm);
}

.map-stats strong {
  display: block;
  margin-bottom: 4px;
  color: var(--primary);
  font-size: 2rem;
  font-weight: 900;
}

.map-stats span {
  color: var(--muted);
  font-weight: 800;
}

.map-content {
  display: grid;
  grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
  gap: 22px;
  align-items: stretch;
}

.map-sidebar {
  display: grid;
  align-content: start;
  gap: 18px;
  max-height: 680px;
  overflow: auto;
}

.filter-panel {
  display: grid;
  gap: 18px;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  box-shadow: var(--shadow-sm);
}

.filter-block {
  display: grid;
  gap: 10px;
}

.filter-title {
  color: #0f172a;
  font-weight: 900;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 9px 12px;
  background: white;
  color: var(--muted);
  font-weight: 900;
  cursor: pointer;
}

.filter-chip:hover {
  border-color: rgba(37, 99, 235, 0.35);
  color: var(--primary);
}

.filter-chip.active {
  border-color: rgba(37, 99, 235, 0.28);
  background: #2563eb;
  color: white;
}

.filter-chip.found.active {
  border-color: rgba(34, 197, 94, 0.28);
  background: #16a34a;
}

.filter-chip.lost.active {
  border-color: rgba(239, 68, 68, 0.28);
  background: #dc2626;
}

.map-item-list {
  display: grid;
  gap: 12px;
}

.map-item {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: white;
}

.map-item:hover,
.map-item.active {
  border-color: rgba(37, 99, 235, 0.35);
  background: #eff6ff;
  box-shadow: var(--shadow-sm);
}

.map-item.muted {
  background: #f8fafc;
}

.map-item-main {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: flex-start;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.map-item-main:disabled {
  cursor: default;
}

.map-item-badge {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #fee2e2;
  color: #b91c1c;
  font-weight: 900;
}

.map-item-badge.found {
  background: #dcfce7;
  color: #166534;
}

.map-item-badge.returned {
  background: #e2e8f0;
  color: #475569;
}

.map-item-content strong,
.map-item-content span,
.map-item-content small {
  display: block;
}

.map-item-content span {
  color: var(--muted);
  font-weight: 800;
}

.map-item-content small {
  margin-top: 4px;
  color: var(--muted);
}

.map-item-link {
  width: fit-content;
  margin-left: 50px;
  color: var(--primary);
  font-weight: 900;
  text-decoration: none;
}

.source-warning {
  color: #b91c1c !important;
}

.missing-position-hint {
  padding: 14px 16px;
  border: 1px solid #fde68a;
  border-radius: 16px;
  background: #fffbeb;
  color: #92400e;
  font-weight: 800;
}

.map-card {
  overflow: hidden;
  padding: 0;
  min-height: 680px;
}

.map-container {
  width: 100%;
  height: 680px;
  border-radius: 24px;
  overflow: hidden;
}

.map-message,
.map-error,
.empty-list {
  padding: 14px 16px;
  border-radius: 16px;
  background: #f8fafc;
  color: var(--muted);
  font-weight: 800;
}

.map-error {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

:global(.findit-map-marker) {
  border: none;
  background: transparent;
}

:global(.findit-marker-shell) {
  width: 42px;
  height: 54px;
  position: relative;
  display: grid;
  place-items: center;
}

:global(.findit-marker-icon) {
  position: relative;
  z-index: 2;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 3px solid white;
  border-radius: 15px;
  background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
  color: white;
  font-size: 1rem;
  font-weight: 900;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.25);
}

:global(.findit-marker-tail) {
  position: absolute;
  z-index: 1;
  bottom: 7px;
  width: 18px;
  height: 18px;
  border-right: 3px solid white;
  border-bottom: 3px solid white;
  border-radius: 0 0 6px 0;
  background: #b91c1c;
  transform: rotate(45deg);
}

:global(.findit-map-marker.found .findit-marker-icon) {
  background: linear-gradient(135deg, #22c55e 0%, #15803d 100%);
}

:global(.findit-map-marker.found .findit-marker-tail) {
  background: #15803d;
}

:global(.findit-map-marker.returned .findit-marker-icon) {
  background: linear-gradient(135deg, #94a3b8 0%, #475569 100%);
}

:global(.findit-map-marker.returned .findit-marker-tail) {
  background: #475569;
}

:global(.findit-popup-card) {
  display: grid;
  gap: 6px;
  min-width: 210px;
}

:global(.findit-popup-card strong) {
  color: #0f172a;
}

:global(.findit-popup-card span) {
  color: #2563eb;
  font-weight: 800;
}

:global(.findit-popup-card p) {
  margin: 0;
  color: #64748b;
}

:global(.findit-popup-card a) {
  width: fit-content;
  margin-top: 6px;
  color: #2563eb;
  font-weight: 900;
  text-decoration: none;
}

@media (max-width: 950px) {
  .map-header {
    flex-direction: column;
  }

  .map-header .btn-primary {
    width: 100%;
  }

  .map-content {
    grid-template-columns: 1fr;
  }

  .map-sidebar {
    max-height: none;
  }

  .map-card,
  .map-container {
    min-height: 520px;
    height: 520px;
  }
}

@media (max-width: 700px) {
  .map-stats {
    grid-template-columns: 1fr;
  }
}
</style>