export interface CampusLocation {
  name: string
  label: string
  latitude: number
  longitude: number
  description: string
}

export const DEFAULT_CAMPUS_LOCATION: CampusLocation = {
  name: 'Mensa',
  label: 'Mensa',
  latitude: 47.66718,
  longitude: 9.17178,
  description: 'Mensa und Aufenthaltsbereich auf dem Campus.',
}

export const CAMPUS_LOCATIONS: CampusLocation[] = [
  DEFAULT_CAMPUS_LOCATION,
  {
    name: 'Bibliothek',
    label: 'Bibliothek',
    latitude: 47.66772,
    longitude: 9.17105,
    description: 'Bibliothek und Lernbereiche.',
  },
  {
    name: 'Gebäude A',
    label: 'Gebäude A',
    latitude: 47.66753,
    longitude: 9.17138,
    description: 'Zentraler Gebäudebereich auf dem Campus.',
  },
  {
    name: 'Gebäude F',
    label: 'Gebäude F',
    latitude: 47.66718,
    longitude: 9.17242,
    description: 'Gebäudebereich F.',
  },
  {
    name: 'Sporthalle',
    label: 'Sporthalle',
    latitude: 47.66693,
    longitude: 9.17205,
    description: 'Sporthalle und umliegender Bereich.',
  },
  {
    name: 'Haupteingang',
    label: 'Haupteingang',
    latitude: 47.66741,
    longitude: 9.1719,
    description: 'Haupteingang und zentraler Campuszugang.',
  },
  {
    name: 'Innenhof',
    label: 'Innenhof',
    latitude: 47.66742,
    longitude: 9.17168,
    description: 'Innenhof und Wege zwischen den Gebäuden.',
  },
  {
    name: 'Parkplatz',
    label: 'Parkplatz',
    latitude: 47.66655,
    longitude: 9.1721,
    description: 'Parkplatz und Außenbereich.',
  },
  {
    name: 'Seerhein',
    label: 'Seerhein / Uferbereich',
    latitude: 47.6679,
    longitude: 9.1703,
    description: 'Uferbereich in Campusnähe.',
  },
]

export function findCampusLocationByName(name: string | null | undefined) {
  if (!name) {
    return null
  }

  const normalizedName = normalizeLocationName(name)

  return (
    CAMPUS_LOCATIONS.find((location) => {
      return normalizeLocationName(location.name) === normalizedName
    }) ?? null
  )
}

export function resolveItemCoordinates(
  locationName: string,
  latitude?: number | null,
  longitude?: number | null,
) {
  if (typeof latitude === 'number' && typeof longitude === 'number') {
    return {
      latitude,
      longitude,
    }
  }

  const campusLocation = findCampusLocationByName(locationName)

  if (campusLocation) {
    return {
      latitude: campusLocation.latitude,
      longitude: campusLocation.longitude,
    }
  }

  return {
    latitude: DEFAULT_CAMPUS_LOCATION.latitude,
    longitude: DEFAULT_CAMPUS_LOCATION.longitude,
  }
}

function normalizeLocationName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace('ä', 'ae')
    .replace('ö', 'oe')
    .replace('ü', 'ue')
    .replace('ß', 'ss')
    .replace(/[^a-z0-9]/g, '')
}