import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Clock, MapPin, Power, List, Map } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/Button'
import { TonightMap, VenueMapSheet } from '../components/TonightMap'
import { TonightSetupModal, type TonightSetupData } from '../components/TonightSetupModal'
import { geocodeAddress, type MapVenue } from '../lib/map'
import { formatTimeRemaining, INTENT_LABELS, roundCoordinate } from '../lib/utils'
import type { TonightSession, VenueSummary } from '../types'

type ViewMode = 'map' | 'list'

export function TonightPage() {
  const { user, profile } = useAuth()
  const [session, setSession] = useState<TonightSession | null>(null)
  const [venues, setVenues] = useState<VenueSummary[]>([])
  const [mapVenues, setMapVenues] = useState<MapVenue[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('map')
  const [showSetup, setShowSetup] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [setupError, setSetupError] = useState('')
  const [selectedMapVenue, setSelectedMapVenue] = useState<MapVenue | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  const loadData = async () => {
    if (!user) return
    setLoading(true)

    const { data: sessions } = await supabase
      .from('tonight_sessions')
      .select('*, venue:venues(name, type, city, address)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)

    setSession((sessions?.[0] as TonightSession | undefined) ?? null)

    const city = profile?.city ?? null
    const { data: venueData } = await supabase.rpc('get_active_venues', { p_city: city })
    setVenues((venueData as VenueSummary[] | null) ?? [])

    const { data: mapData } = await supabase.rpc('get_map_venues', { p_city: city })
    setMapVenues(
      ((mapData as MapVenue[] | null) ?? []).map((v) => ({
        ...v,
        latitude: Number(v.latitude),
        longitude: Number(v.longitude),
      }))
    )

    setLoading(false)
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [user, profile?.city])

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: roundCoordinate(pos.coords.latitude),
          lng: roundCoordinate(pos.coords.longitude),
        })
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    )
  }, [])

  const turnOnTonight = async (data: TonightSetupData) => {
    if (!user) return
    setSubmitting(true)
    setSetupError('')

    const coords = await geocodeAddress(data.venueAddress)
    if (!coords) {
      setSetupError('Could not find that address. Try a full street address.')
      setSubmitting(false)
      return
    }

    const lat = roundCoordinate(coords.lat)
    const lng = roundCoordinate(coords.lng)

    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .insert({
        name: data.venueName,
        type: data.venueType,
        city: profile?.city ?? 'Miami',
        address: data.venueAddress,
        latitude: lat,
        longitude: lng,
        created_by: user.id,
      })
      .select()
      .single()

    if (venueError || !venue) {
      setSetupError(venueError?.message ?? 'Failed to save venue')
      setSubmitting(false)
      return
    }

    if (session) {
      await supabase
        .from('tonight_sessions')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', session.id)
    }

    const expiresAt = new Date(Date.now() + data.duration * 60 * 60 * 1000).toISOString()

    const { error: sessionError } = await supabase.from('tonight_sessions').insert({
      user_id: user.id,
      venue_id: venue.id,
      intent: data.intent,
      status_message: data.statusMessage || null,
      visibility_mode: data.visibilityMode,
      approximate_latitude: lat,
      approximate_longitude: lng,
      expires_at: expiresAt,
    })

    if (sessionError) {
      setSetupError(sessionError.message)
      setSubmitting(false)
      return
    }

    setShowSetup(false)
    setSubmitting(false)
    await loadData()
  }

  const turnOffTonight = async () => {
    if (!session) return
    await supabase
      .from('tonight_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', session.id)
    setSession(null)
    setSelectedMapVenue(null)
    await loadData()
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-tonight-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Moon className="text-tonight-accent shrink-0" size={22} />
          <h1 className="text-xl font-semibold truncate">Tonight Mode</h1>
        </div>
        <div className="flex shrink-0 rounded-xl border border-tonight-border bg-tonight-card p-1">
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex min-h-[40px] min-w-[44px] items-center justify-center rounded-lg px-3 ${
              viewMode === 'map' ? 'bg-tonight-accent text-white' : 'text-tonight-muted'
            }`}
            aria-label="Map view"
          >
            <Map size={18} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex min-h-[40px] min-w-[44px] items-center justify-center rounded-lg px-3 ${
              viewMode === 'list' ? 'bg-tonight-accent text-white' : 'text-tonight-muted'
            }`}
            aria-label="List view"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {!session ? (
        <div className="rounded-2xl border border-tonight-border bg-tonight-card p-5 text-center">
          <h2 className="text-lg font-semibold">Turn on Tonight Mode</h2>
          <p className="mt-2 text-sm text-tonight-muted leading-relaxed">
            Let people know you are open to meeting tonight. Your venue appears on the map — never your exact location.
          </p>
          <div className="mt-5 px-1">
            <Button fullWidth onClick={() => setShowSetup(true)}>
              Turn on Tonight Mode
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-tonight-accent/40 bg-tonight-accent/10 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-tonight-accent">You are live</p>
              <h2 className="mt-1 text-lg font-semibold truncate">{session.venue?.name}</h2>
              <p className="text-sm text-tonight-muted">{INTENT_LABELS[session.intent]}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1 text-sm text-tonight-muted">
              <Clock size={14} />
              {formatTimeRemaining(session.expires_at)}
            </div>
          </div>
          {session.status_message && (
            <p className="mt-2 text-sm italic text-tonight-muted">"{session.status_message}"</p>
          )}
          <div className="mt-4 flex gap-3">
            <Button variant="secondary" className="flex-1 !min-h-[44px]" onClick={() => setShowSetup(true)}>
              Edit
            </Button>
            <Button variant="danger" className="flex-1 !min-h-[44px]" onClick={turnOffTonight}>
              <Power size={16} /> Turn off
            </Button>
          </div>
        </div>
      )}

      {viewMode === 'map' && !showSetup ? (
        <section className="mt-5">
          <p className="mb-2 text-xs text-tonight-muted">
            Venues with active users · tap a marker to view profiles
          </p>
          <TonightMap
            venues={mapVenues}
            userLocation={userLocation}
            onSelectVenue={setSelectedMapVenue}
          />
        </section>
      ) : viewMode === 'list' ? (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-medium text-tonight-muted uppercase tracking-wide">
            Venues nearby
          </h2>
          {venues.length === 0 ? (
            <p className="text-sm text-tonight-muted">No active venues in your area yet.</p>
          ) : (
            <div className="space-y-2">
              {venues.map((v) => (
                <Link
                  key={v.venue_id}
                  to={`/venue/${v.venue_id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-tonight-border bg-tonight-card p-4 min-h-[56px] active:bg-tonight-border/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <MapPin size={20} className="text-tonight-accent shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{v.venue_name}</p>
                      <p className="text-xs text-tonight-muted capitalize">{v.venue_type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <span className="text-sm text-tonight-accent font-semibold shrink-0">
                    {v.open_count} open
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <TonightSetupModal
        open={showSetup}
        isFemale={profile?.gender === 'female'}
        isUpdate={!!session}
        loading={submitting}
        error={setupError}
        onClose={() => {
          setShowSetup(false)
          setSetupError('')
        }}
        onSubmit={turnOnTonight}
      />

      <VenueMapSheet
        venue={selectedMapVenue}
        userLocation={userLocation}
        onClose={() => setSelectedMapVenue(null)}
      />
    </div>
  )
}
