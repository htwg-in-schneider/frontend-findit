import { MAP_SEARCH_VIEWBOX, type Coordinates } from '../config/mapConfig'

export interface GeocodingResult extends Coordinates {
  displayName: string
  shortName: string
  type: string
}

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
  name?: string
  type?: string
  class?: string
}

const geocodingCache = new Map<string, GeocodingResult[]>()
let lastRequestTimestamp = 0

export async function geocodeLocation(query: string, limit = 5): Promise<GeocodingResult[]> {
  const normalizedQuery = normalizeQuery(query)

  if (normalizedQuery.length < 3) {
    return []
  }

  const cacheKey = `${normalizedQuery}:${limit}`

  const cachedResults = geocodingCache.get(cacheKey)

  if (cachedResults) {
    return cachedResults
  }

  await waitForRateLimitSlot()

  const params = new URLSearchParams({
    format: 'jsonv2',
    q: buildSearchQuery(query),
    limit: String(Math.max(limit * 3, 10)),
    addressdetails: '1',
    countrycodes: 'de',
    'accept-language': 'de',
    viewbox: buildViewBox(),
    bounded: '0',
  })

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    return []
  }

  const rawResults = (await response.json()) as NominatimResult[]

  const results = rawResults
    .filter((result) => !isBroadOrUnhelpfulResult(result))
    .map(toGeocodingResult)
    .filter((result): result is GeocodingResult => result !== null)
    .slice(0, limit)

  geocodingCache.set(cacheKey, results)

  return results
}

function toGeocodingResult(result: NominatimResult): GeocodingResult | null {
  const latitude = Number(result.lat)
  const longitude = Number(result.lon)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }

  const displayName = result.display_name || 'Unbekannter Ort'
  const shortName = buildShortName(result)

  return {
    latitude,
    longitude,
    displayName,
    shortName,
    type: result.type || result.class || 'Ort',
  }
}

function isBroadOrUnhelpfulResult(result: NominatimResult) {
  const resultClass = (result.class || '').toLowerCase()
  const resultType = (result.type || '').toLowerCase()
  const displayName = (result.display_name || '').toLowerCase()

  const broadTypes = new Set([
    'city',
    'town',
    'village',
    'hamlet',
    'municipality',
    'administrative',
    'county',
    'state',
    'country',
    'postcode',
    'suburb',
  ])

  if (resultClass === 'boundary') {
    return true
  }

  if (resultClass === 'place' && broadTypes.has(resultType)) {
    return true
  }

  if (displayName === 'konstanz, baden-württemberg, deutschland') {
    return true
  }

  return false
}

function buildShortName(result: NominatimResult) {
  if (result.name && result.name.trim()) {
    return trimToMaxLength(result.name.trim(), 120)
  }

  const firstPart = result.display_name?.split(',')[0]?.trim()

  if (firstPart) {
    return trimToMaxLength(firstPart, 120)
  }

  return 'Ausgewählter Ort'
}

function buildSearchQuery(query: string) {
  const trimmedQuery = query.trim()

  if (trimmedQuery.toLowerCase().includes('konstanz')) {
    return trimmedQuery
  }

  return `${trimmedQuery}, Konstanz, Deutschland`
}

function buildViewBox() {
  return [
    MAP_SEARCH_VIEWBOX.west,
    MAP_SEARCH_VIEWBOX.north,
    MAP_SEARCH_VIEWBOX.east,
    MAP_SEARCH_VIEWBOX.south,
  ].join(',')
}

function normalizeQuery(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function trimToMaxLength(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value
  }

  return value.slice(0, maxLength - 1).trim()
}

async function waitForRateLimitSlot() {
  const now = Date.now()
  const elapsed = now - lastRequestTimestamp
  const minimumDelay = 1100

  if (elapsed < minimumDelay) {
    await new Promise((resolve) => window.setTimeout(resolve, minimumDelay - elapsed))
  }

  lastRequestTimestamp = Date.now()
}