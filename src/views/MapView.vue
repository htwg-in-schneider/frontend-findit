<script setup lang="ts">
import 'leaflet/dist/leaflet.css'

import L from 'leaflet'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { getItems, type Item, type ItemStatus, type ItemType } from '../services/itemService'

type Coordinates = {
  lat: number
  lng: number
}

const mapElement = ref<HTMLElement | null>(null)

let leafletMap: L.Map | null = null
let markerGroup: L.LayerGroup | null = null

const items = ref<Item[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const selectedType = ref('')
const selectedCategory = ref('')
const selectedStatus = ref('')

const campusCenter: Coordinates = {
  lat: 47.6679,
  lng: 9.1717,
}

const knownLocations: Record<string, Coordinates> = {
  bibliothek: {
    lat: 47.6679,
    lng: 9.1714,
  },
  mensa: {
    lat: 47.6673,
    lng: 9.1707,
  },
  'gebäude f': {
    lat: 47.6682,
    lng: 9.1725,
  },
  'gebaeude f': {
    lat: 47.6682,
    lng: 9.1725,
  },
  campus: {
    lat: 47.6679,
    lng: 9.1717,
  },
  htwg: {
    lat: 47.6679,
    lng: 9.1717,
  },
}

const categories = computed(() => {
  const categorySet = new Set<string>()

  items.value.forEach((item) => {
    if (item.category) {
      categorySet.add(item.category)
    }
  })

  return [...categorySet].sort()
})

const filteredItems = computed(() => {
  return items.value.filter((item) => {
    const matchesType = !selectedType.value || item.type === selectedType.value
    const matchesCategory = !selectedCategory.value || item.category === selectedCategory.value
    const matchesStatus = !selectedStatus.value || item.status === selectedStatus.value

    return matchesType && matchesCategory && matchesStatus
  })
})

async function loadItems() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    items.value = await getItems()
  } catch (error) {
    console.error(error)
    errorMessage.value =
      'Die Kartendaten konnten nicht geladen werden. Bitte prüfe, ob das Backend läuft.'
  } finally {
    isLoading.value = false
  }
}

async function initMap() {
  await nextTick()

  if (!mapElement.value || leafletMap) {
    return
  }

  leafletMap = L.map(mapElement.value, {
    zoomControl: true,
    scrollWheelZoom: true,
  }).setView([campusCenter.lat, campusCenter.lng], 17)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap-Mitwirkende',
    maxZoom: 19,
  }).addTo(leafletMap)

  markerGroup = L.layerGroup().addTo(leafletMap)
}

function renderMarkers() {
  if (!leafletMap || !markerGroup) {
    return
  }

  markerGroup.clearLayers()

  filteredItems.value.forEach((item, index) => {
    const coordinates = getCoordinatesForLocation(item.location, item.id ?? index)

    L.marker([coordinates.lat, coordinates.lng], {
      icon: createMarkerIcon(item.type),
    })
      .bindPopup(createPopupContent(item))
      .addTo(markerGroup as L.LayerGroup)
  })

  const markerLayers = markerGroup.getLayers()

  if (markerLayers.length > 0) {
    const bounds = L.featureGroup(markerLayers).getBounds()

    leafletMap.fitBounds(bounds, {
      padding: [36, 36],
      maxZoom: 17,
    })
  } else {
    leafletMap.setView([campusCenter.lat, campusCenter.lng], 17)
  }
}

function getCoordinatesForLocation(location: string, itemId: number): Coordinates {
  const normalizedLocation = location.trim().toLowerCase()

  for (const [knownLocation, coordinates] of Object.entries(knownLocations)) {
    if (normalizedLocation.includes(knownLocation)) {
      return coordinates
    }
  }

  return createFallbackCoordinates(itemId)
}

function createFallbackCoordinates(itemId: number): Coordinates {
  const offsetSeed = itemId % 9

  return {
    lat: campusCenter.lat + (offsetSeed - 4) * 0.00018,
    lng: campusCenter.lng + (offsetSeed - 4) * 0.00022,
  }
}

function createMarkerIcon(type: ItemType) {
  const markerClass = type === 'LOST' ? 'findit-marker lost-marker' : 'findit-marker found-marker'
  const markerLabel = type === 'LOST' ? '!' : '✓'

  return L.divIcon({
    className: markerClass,
    html: `<span>${markerLabel}</span>`,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -38],
  })
}

function createPopupContent(item: Item) {
  const detailUrl = `${import.meta.env.BASE_URL}items/${item.id}`

  return `
    <article class="map-popup">
      <div class="map-popup-badges">
        <span>${typeLabel(item.type)}</span>
        <span>${statusLabel(item.status)}</span>
      </div>

      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description)}</p>

      <dl>
        <div>
          <dt>Ort</dt>
          <dd>${escapeHtml(item.location)}</dd>
        </div>
        <div>
          <dt>Kategorie</dt>
          <dd>${escapeHtml(item.category)}</dd>
        </div>
        <div>
          <dt>Datum</dt>
          <dd>${escapeHtml(item.date)}</dd>
        </div>
      </dl>

      <a href="${detailUrl}">Details öffnen</a>
    </article>
  `
}

function escapeHtml(value: string | null | undefined) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function resetFilters() {
  selectedType.value = ''
  selectedCategory.value = ''
  selectedStatus.value = ''
}

function typeLabel(type: ItemType) {
  return type === 'LOST' ? 'Verloren' : 'Gefunden'
}

function statusLabel(status: ItemStatus) {
  const labels: Record<ItemStatus, string> = {
    OPEN: 'Offen',
    IN_PROGRESS: 'In Klärung',
    RETURNED: 'Zurückgegeben',
  }

  return labels[status]
}

function typeBadgeClass(type: ItemType) {
  return type === 'LOST' ? 'badge-lost' : 'badge-found'
}

function statusBadgeClass(status: ItemStatus) {
  const classes: Record<ItemStatus, string> = {
    OPEN: 'badge-open',
    IN_PROGRESS: 'badge-progress',
    RETURNED: 'badge-returned',
  }

  return classes[status]
}

onMounted(async () => {
  await initMap()
  await loadItems()
  renderMarkers()
})

onUnmounted(() => {
  leafletMap?.remove()
  leafletMap = null
  markerGroup = null
})

watch(filteredItems, () => {
  renderMarkers()
})
</script>

<template>
  <section class="map-page">
    <div class="container map-header">
      <div>
        <p class="eyebrow">Campuskarte</p>
        <h1 class="section-title">Einträge auf der Karte</h1>
        <p class="section-subtitle">
          Verlorene und gefundene Gegenstände werden als Marker auf dem Campus dargestellt. So
          siehst du sofort, wo ein Gegenstand gefunden oder verloren wurde.
        </p>
      </div>

      <RouterLink to="/items/new" class="btn-primary">Gegenstand melden</RouterLink>
    </div>

    <div class="container map-layout">
      <aside class="card map-sidebar">
        <h2>Filter</h2>

        <div class="form-group">
          <label for="map-type">Typ</label>
          <select id="map-type" v-model="selectedType">
            <option value="">Alle Typen</option>
            <option value="LOST">Verloren</option>
            <option value="FOUND">Gefunden</option>
          </select>
        </div>

        <div class="form-group">
          <label for="map-category">Kategorie</label>
          <select id="map-category" v-model="selectedCategory">
            <option value="">Alle Kategorien</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="map-status">Status</label>
          <select id="map-status" v-model="selectedStatus">
            <option value="">Alle Status</option>
            <option value="OPEN">Offen</option>
            <option value="IN_PROGRESS">In Klärung</option>
            <option value="RETURNED">Zurückgegeben</option>
          </select>
        </div>

        <button type="button" class="btn-secondary sidebar-button" @click="resetFilters">
          Filter zurücksetzen
        </button>

        <div class="map-stats">
          <strong>{{ filteredItems.length }}</strong>
          <span>sichtbare Einträge</span>
        </div>

        <div class="legend">
          <div>
            <span class="legend-dot found"></span>
            Gefunden
          </div>
          <div>
            <span class="legend-dot lost"></span>
            Verloren
          </div>
        </div>
      </aside>

      <div class="map-content">
        <div v-if="errorMessage" class="card error-box">
          {{ errorMessage }}
        </div>

        <div class="map-card">
          <div ref="mapElement" class="leaflet-map"></div>

          <div v-if="isLoading" class="map-loading">
            Einträge werden geladen...
          </div>
        </div>

        <div class="map-results">
          <article v-for="item in filteredItems" :key="item.id" class="card map-result-card">
            <div class="item-card-header">
              <span class="badge" :class="typeBadgeClass(item.type)">
                {{ typeLabel(item.type) }}
              </span>

              <span class="badge" :class="statusBadgeClass(item.status)">
                {{ statusLabel(item.status) }}
              </span>
            </div>

            <h2>{{ item.title }}</h2>

            <p>{{ item.location }} · {{ item.category }} · {{ item.date }}</p>

            <RouterLink :to="`/items/${item.id}`" class="btn-secondary">Details öffnen</RouterLink>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.map-page {
  padding: 72px 0;
  min-height: calc(100vh - 76px);
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 32%),
    linear-gradient(135deg, #f8fafc 0%, #ffffff 52%, #eff6ff 100%);
}

.map-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
}

.map-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.map-sidebar {
  position: sticky;
  top: 100px;
  display: grid;
  gap: 18px;
}

.map-sidebar h2 {
  margin: 0;
}

.sidebar-button {
  width: 100%;
}

.map-stats {
  display: grid;
  gap: 4px;
  padding: 18px;
  border-radius: var(--radius-md);
  background: #eff6ff;
}

.map-stats strong {
  font-size: 2rem;
  color: var(--primary);
}

.map-stats span {
  color: var(--muted);
  font-weight: 700;
}

.legend {
  display: grid;
  gap: 10px;
  color: var(--muted);
  font-weight: 700;
}

.legend div {
  display: flex;
  align-items: center;
  gap: 10px;
}

.legend-dot {
  width: 14px;
  height: 14px;
  border-radius: 999px;
}

.legend-dot.found {
  background: var(--success);
}

.legend-dot.lost {
  background: var(--accent);
}

.map-content {
  display: grid;
  gap: 24px;
}

.map-card {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 32px;
  background: white;
  box-shadow: var(--shadow-md);
}

.leaflet-map {
  min-height: 620px;
  width: 100%;
  z-index: 1;
}

.map-loading {
  position: absolute;
  inset: 24px auto auto 24px;
  z-index: 2;
  padding: 12px 16px;
  border-radius: 999px;
  background: white;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  font-weight: 800;
}

.map-results {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.map-result-card {
  display: grid;
  gap: 12px;
}

.map-result-card h2 {
  margin: 0;
  font-size: 1.2rem;
}

.map-result-card p {
  margin: 0;
  color: var(--muted);
}

.item-card-header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.error-box {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
  font-weight: 700;
}

:global(.findit-marker) {
  border: none;
  background: transparent;
}

:global(.findit-marker span) {
  width: 42px;
  height: 42px;
  border: 4px solid white;
  border-radius: 18px 18px 18px 4px;
  display: grid;
  place-items: center;
  color: white;
  font-weight: 900;
  font-size: 1rem;
  line-height: 1;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.24);
  transform: rotate(-45deg);
}

:global(.findit-marker span) {
  text-align: center;
}

:global(.found-marker span) {
  background: #16a34a;
}

:global(.lost-marker span) {
  background: #ea580c;
}

:global(.map-popup) {
  min-width: 220px;
}

:global(.map-popup h3) {
  margin: 10px 0 6px;
  font-size: 1.05rem;
}

:global(.map-popup p) {
  margin: 0 0 10px;
  color: #4b5563;
  line-height: 1.5;
}

:global(.map-popup dl) {
  display: grid;
  gap: 6px;
  margin: 0 0 12px;
}

:global(.map-popup div) {
  display: grid;
  gap: 2px;
}

:global(.map-popup dt) {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 800;
  text-transform: uppercase;
}

:global(.map-popup dd) {
  margin: 0;
  font-weight: 700;
}

:global(.map-popup a) {
  display: inline-flex;
  color: #2563eb;
  font-weight: 800;
}

:global(.map-popup-badges) {
  display: flex !important;
  flex-direction: row;
  gap: 6px;
}

:global(.map-popup-badges span) {
  padding: 4px 8px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1e40af;
  font-weight: 800;
  font-size: 0.78rem;
}

@media (max-width: 950px) {
  .map-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .map-layout {
    grid-template-columns: 1fr;
  }

  .map-sidebar {
    position: static;
  }

  .leaflet-map {
    min-height: 480px;
  }

  .map-results {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .map-page {
    padding: 48px 0;
  }

  .leaflet-map {
    min-height: 380px;
  }
}
</style>