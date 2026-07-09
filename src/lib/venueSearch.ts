import { roundCoordinate } from './utils'

export interface VenueSuggestion {
  venueName: string
  formattedAddress: string
  latitude: number
  longitude: number
  placeId: string
  provider: string
  city: string | null
  state: string | null
  country: string | null
  venueType: string
  categoryLabel: string | null
  isManual: false
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] }
  properties: {
    name?: string
    street?: string
    housenumber?: string
    city?: string
    state?: string
    country?: string
    postcode?: string
    osm_type?: string
    osm_id?: number
    osm_key?: string
    osm_value?: string
    type?: string
  }
}

const VENUE_OSM_KEYS = new Set(['amenity', 'leisure', 'tourism', 'shop', 'building'])

function mapOsmToVenueType(osmKey?: string, osmValue?: string): string {
  const key = (osmKey ?? '').toLowerCase()
  const val = (osmValue ?? '').toLowerCase()

  if (val === 'bar' || val === 'pub' || val === 'biergarten') return 'bar'
  if (val === 'nightclub' || val === 'club') return 'club'
  if (val === 'restaurant' || val === 'food' || val === 'fast_food') return 'restaurant'
  if (val === 'cafe' || val === 'coffee_shop') return 'coffee_shop'
  if (val === 'lounge') return 'lounge'
  if (key === 'amenity' && val === 'events_venue') return 'event'

  return 'other'
}

function formatCategory(osmKey?: string, osmValue?: string): string | null {
  if (!osmValue) return null
  return osmValue.replace(/_/g, ' ')
}

function buildAddress(props: PhotonFeature['properties']): string {
  const street = [props.housenumber, props.street].filter(Boolean).join(' ')
  const parts = [street, props.city, props.state, props.postcode, props.country].filter(Boolean)
  return parts.join(', ')
}

function isVenueLike(props: PhotonFeature['properties']): boolean {
  const key = (props.osm_key ?? '').toLowerCase()
  const val = (props.osm_value ?? '').toLowerCase()
  if (VENUE_OSM_KEYS.has(key)) return true
  if (key === 'name' && props.name) return true
  const venueValues = ['bar', 'pub', 'restaurant', 'cafe', 'nightclub', 'club', 'lounge', 'biergarten', 'fast_food']
  return venueValues.includes(val)
}

function featureToSuggestion(f: PhotonFeature): VenueSuggestion | null {
  const props = f.properties
  const name = props.name?.trim()
  if (!name) return null

  const [lng, lat] = f.geometry.coordinates
  const formattedAddress = buildAddress(props)
  if (!formattedAddress) return null

  const osmType = props.osm_type ?? 'N'
  const osmId = props.osm_id ?? 0
  const venueType = mapOsmToVenueType(props.osm_key, props.osm_value)

  return {
    venueName: name,
    formattedAddress,
    latitude: roundCoordinate(lat),
    longitude: roundCoordinate(lng),
    placeId: `osm:${osmType}:${osmId}`,
    provider: 'photon',
    city: props.city ?? null,
    state: props.state ?? null,
    country: props.country ?? null,
    venueType,
    categoryLabel: formatCategory(props.osm_key, props.osm_value),
    isManual: false,
  }
}

function scoreSuggestion(s: VenueSuggestion, query: string): number {
  const q = query.toLowerCase()
  let score = 0
  if (s.venueName.toLowerCase().startsWith(q)) score += 10
  else if (s.venueName.toLowerCase().includes(q)) score += 5
  if (s.categoryLabel) score += 2
  if (s.city?.toLowerCase().includes(q)) score += 1
  return score
}

async function fetchPhoton(query: string, layer?: string): Promise<VenueSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    limit: '10',
    lang: 'en',
  })
  if (layer) params.set('layer', layer)

  const res = await fetch(`https://photon.komoot.io/api/?${params}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) return []

  const data = await res.json()
  const features: PhotonFeature[] = data.features ?? []

  return features
    .filter((f) => isVenueLike(f.properties))
    .map(featureToSuggestion)
    .filter((s): s is VenueSuggestion => s !== null)
}

export async function searchVenues(query: string): Promise<VenueSuggestion[]> {
  const q = query.trim()
  if (q.length < 2) return []

  try {
    const [venueLayer, broad] = await Promise.all([
      fetchPhoton(q, 'venue'),
      fetchPhoton(q),
    ])

    const merged = [...venueLayer, ...broad]
    const seen = new Set<string>()
    const unique = merged.filter((s) => {
      if (seen.has(s.placeId)) return false
      seen.add(s.placeId)
      return true
    })

    return unique
      .sort((a, b) => scoreSuggestion(b, q) - scoreSuggestion(a, q))
      .slice(0, 8)
  } catch {
    return []
  }
}

export function manualVenueSuggestion(
  name: string,
  address: string,
  city: string | null,
  state: string | null,
  venueType: string
): VenueSuggestion {
  return {
    venueName: name.trim(),
    formattedAddress: address.trim(),
    latitude: 0,
    longitude: 0,
    placeId: '',
    provider: 'manual',
    city,
    state,
    country: null,
    venueType,
    categoryLabel: 'Manual venue',
    isManual: false,
  }
}
