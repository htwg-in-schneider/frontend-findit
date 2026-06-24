export interface Coordinates {
  latitude: number
  longitude: number
}

export const MAP_DEFAULT_CENTER: Coordinates = {
  latitude: 47.66743,
  longitude: 9.17166,
}

export const MAP_DEFAULT_ZOOM = 17

export const MAP_SEARCH_VIEWBOX = {
  west: 9.1688,
  north: 47.6693,
  east: 9.1743,
  south: 47.6658,
}

export const MAP_MAX_ZOOM = 20
export const MAP_MIN_ZOOM = 14

export function hasValidCoordinates(latitude?: number | null, longitude?: number | null) {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

export function getCoordinateKey(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)}:${longitude.toFixed(5)}`
}

export function getMarkerOffset(index: number, total: number) {
  if (total <= 1) {
    return {
      latitude: 0,
      longitude: 0,
    }
  }

  const angle = (Math.PI * 2 * index) / total
  const radius = 0.00009

  return {
    latitude: Math.sin(angle) * radius,
    longitude: Math.cos(angle) * radius,
  }
}