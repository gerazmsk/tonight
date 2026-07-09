import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Clock, MapPin, Power } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatTimeRemaining, INTENT_LABELS, VISIBILITY_LABELS, VENUE_TYPES, DURATION_OPTIONS, roundCoordinate } from '../lib/utils'
import type { TonightSession, VenueSummary, VisibilityMode, TonightIntent } from '../types'

export function TonightPage() {
  const { user, profile } = useAuth()
  const [session, setSession] = useState<TonightSession | null>(null)
  const [venues, setVenues] = useState<VenueSummary[]>([])
  const [showSetup, setShowSetup] = useState(false)
  const [loading, setLoading] = useState(true)

  const [venueName, setVenueName] = useState('')
  const [venueType, setVenueType] = useState('bar')
  const [intent, setIntent] = useState<TonightIntent>('drinks')
  const [duration, setDuration] = useState(2)
  const [statusMessage, setStatusMessage] = useState('')
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>(
    profile?.gender === 'female' ? 'likes_only' : 'likes_only'
  )

  const loadData = async () => {
    if (!user) return
    setLoading(true)

    const { data: sessions } = await supabase
      .from('tonight_sessions')
      .select('*, venue:venues(name, type, city)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)

    setSession((sessions?.[0] as TonightSession | undefined) ?? null)

    const { data: venueData } = await supabase.rpc('get_active_venues', {
      p_city: profile?.city ?? null,
    })
    setVenues((venueData as VenueSummary[] | null) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 60000)
    return () => clearInterval(interval)
  }, [user, profile?.city])

  const turnOnTonight = async () => {
    if (!user || !venueName.trim()) return

    let lat: number | null = null
    let lng: number | null = null

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      })
      lat = roundCoordinate(pos.coords.latitude)
      lng = roundCoordinate(pos.coords.longitude)
    } catch {
      // Location optional — venue name is enough
    }

    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .insert({
        name: venueName.trim(),
        type: venueType,
        city: profile?.city ?? 'Miami',
        latitude: lat,
        longitude: lng,
        created_by: user.id,
      })
      .select()
      .single()

    if (venueError || !venue) return

    const expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000).toISOString()

    await supabase.from('tonight_sessions').insert({
      user_id: user.id,
      venue_id: venue.id,
      intent,
      status_message: statusMessage.trim() || null,
      visibility_mode: profile?.gender === 'female' ? visibilityMode : 'likes_only',
      approximate_latitude: lat,
      approximate_longitude: lng,
      expires_at: expiresAt,
    })

    setShowSetup(false)
    await loadData()
  }

  const turnOffTonight = async () => {
    if (!session) return
    await supabase
      .from('tonight_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', session.id)
    setSession(null)
    await loadData()
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-tonight-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="px-4 py-5">
      <div className="mb-6 flex items-center gap-2">
        <Moon className="text-tonight-accent" size={22} />
        <h1 className="text-xl font-semibold">Tonight Mode</h1>
      </div>

      {!session ? (
        <div className="rounded-2xl border border-tonight-border bg-tonight-card p-6 text-center">
          <h2 className="text-lg font-semibold">Turn on Tonight Mode</h2>
          <p className="mt-2 text-sm text-tonight-muted">
            Let people know you are open to meeting tonight.
          </p>
          <button
            onClick={() => setShowSetup(true)}
            className="mt-5 w-full rounded-xl bg-tonight-accent py-3 font-semibold hover:bg-tonight-accent-hover"
          >
            Turn on Tonight Mode
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-tonight-accent/40 bg-tonight-accent/10 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-tonight-accent">Active</p>
              <h2 className="mt-1 text-lg font-semibold">{session.venue?.name}</h2>
              <p className="text-sm text-tonight-muted">{INTENT_LABELS[session.intent]}</p>
            </div>
            <div className="flex items-center gap-1 text-sm text-tonight-muted">
              <Clock size={14} />
              {formatTimeRemaining(session.expires_at)}
            </div>
          </div>
          {session.status_message && (
            <p className="mt-3 text-sm italic text-tonight-muted">"{session.status_message}"</p>
          )}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setShowSetup(true)}
              className="flex-1 rounded-xl border border-tonight-border py-2.5 text-sm"
            >
              Edit
            </button>
            <button
              onClick={turnOffTonight}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600/80 py-2.5 text-sm font-medium"
            >
              <Power size={14} /> Turn off
            </button>
          </div>
        </div>
      )}

      {showSetup && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-4 sm:items-center sm:justify-center">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-tonight-card border border-tonight-border p-5">
            <h2 className="text-lg font-semibold">Tonight setup</h2>

            <label className="mt-4 mb-1 block text-sm text-tonight-muted">Venue name</label>
            <input
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="e.g. Komodo Miami"
              className="w-full rounded-xl border border-tonight-border bg-tonight-bg px-3 py-2.5"
            />

            <label className="mt-3 mb-1 block text-sm text-tonight-muted">Venue type</label>
            <select
              value={venueType}
              onChange={(e) => setVenueType(e.target.value)}
              className="w-full rounded-xl border border-tonight-border bg-tonight-bg px-3 py-2.5"
            >
              {VENUE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <label className="mt-3 mb-1 block text-sm text-tonight-muted">Intent</label>
            <select
              value={intent}
              onChange={(e) => setIntent(e.target.value as TonightIntent)}
              className="w-full rounded-xl border border-tonight-border bg-tonight-bg px-3 py-2.5"
            >
              {Object.entries(INTENT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            <label className="mt-3 mb-1 block text-sm text-tonight-muted">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-xl border border-tonight-border bg-tonight-bg px-3 py-2.5"
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>

            <label className="mt-3 mb-1 block text-sm text-tonight-muted">Status message (optional)</label>
            <input
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="At the bar with friends"
              className="w-full rounded-xl border border-tonight-border bg-tonight-bg px-3 py-2.5"
            />

            {profile?.gender === 'female' && (
              <>
                <label className="mt-3 mb-1 block text-sm text-tonight-muted">Visibility</label>
                <select
                  value={visibilityMode}
                  onChange={(e) => setVisibilityMode(e.target.value as VisibilityMode)}
                  className="w-full rounded-xl border border-tonight-border bg-tonight-bg px-3 py-2.5"
                >
                  <option value="invisible">{VISIBILITY_LABELS.invisible} — Nobody sees you</option>
                  <option value="likes_only">{VISIBILITY_LABELS.likes_only} — Only men you like</option>
                  <option value="venue_visible">{VISIBILITY_LABELS.venue_visible} — Same venue only</option>
                </select>
                <p className="mt-2 text-xs text-tonight-muted">
                  Only people you choose can see you. Your exact location is never shown.
                </p>
              </>
            )}

            <div className="mt-5 flex gap-2">
              <button onClick={() => setShowSetup(false)} className="flex-1 rounded-xl border border-tonight-border py-3">
                Cancel
              </button>
              <button onClick={turnOnTonight} className="flex-1 rounded-xl bg-tonight-accent py-3 font-semibold">
                {session ? 'Update' : 'Go live'}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="mt-8">
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
                className="flex items-center justify-between rounded-xl border border-tonight-border bg-tonight-card p-4 hover:border-tonight-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-tonight-accent shrink-0" />
                  <div>
                    <p className="font-medium">{v.venue_name}</p>
                    <p className="text-xs text-tonight-muted capitalize">{v.venue_type.replace('_', ' ')}</p>
                  </div>
                </div>
                <span className="text-sm text-tonight-accent font-medium">
                  {v.open_count} open
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
