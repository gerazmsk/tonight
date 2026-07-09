import { supabase } from './supabase'
import type { SelectedVenue } from './tonightDraft'

export async function saveVenueToDatabase(
  venue: SelectedVenue,
  createdBy?: string | null
): Promise<string> {
  const { data, error } = await supabase.rpc('upsert_venue', {
    p_name: venue.venueName,
    p_formatted_address: venue.formattedAddress,
    p_city: venue.city,
    p_state: venue.state,
    p_country: venue.country,
    p_latitude: venue.latitude,
    p_longitude: venue.longitude,
    p_place_id: venue.placeId,
    p_provider: venue.provider,
    p_venue_type: venue.venueType,
    p_is_manual: venue.isManual,
    p_created_by: createdBy ?? undefined,
  })

  if (error) throw error
  return data as string
}

export function suggestionToSelectedVenue(
  s: import('./venueSearch').VenueSuggestion,
  venueId: string | null = null
): SelectedVenue {
  return {
    venueName: s.venueName,
    formattedAddress: s.formattedAddress,
    latitude: s.latitude,
    longitude: s.longitude,
    placeId: s.placeId,
    provider: s.provider,
    city: s.city,
    state: s.state,
    country: s.country,
    venueType: s.venueType,
    isManual: s.provider === 'manual',
    venueId,
    categoryLabel: s.categoryLabel,
  }
}
