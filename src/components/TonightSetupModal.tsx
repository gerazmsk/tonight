import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'
import { VenueAutocomplete } from './VenueAutocomplete'
import { INTENT_LABELS, VISIBILITY_LABELS, VENUE_TYPES, DURATION_OPTIONS } from '../lib/utils'
import {
  clearTonightDraft,
  createEmptyDraft,
  loadTonightDraft,
  saveTonightDraft,
  type SelectedVenue,
  type TonightDraft,
} from '../lib/tonightDraft'
import { geocodeAddress } from '../lib/map'
import { saveVenueToDatabase, suggestionToSelectedVenue } from '../lib/venues'
import { type VenueSuggestion } from '../lib/venueSearch'
import { roundCoordinate } from '../lib/utils'
import type { VisibilityMode, TonightIntent } from '../types'

export interface TonightSetupData {
  venueId: string
  selectedVenue: SelectedVenue
  intent: TonightIntent
  statusMessage: string
  duration: number
  visibilityMode: VisibilityMode
}

interface TonightSetupModalProps {
  open: boolean
  userId: string
  isFemale: boolean
  isUpdate: boolean
  loading: boolean
  error: string
  onClose: () => void
  onCancel: () => void
  onSubmit: (data: TonightSetupData) => void
}

export function TonightSetupModal({
  open,
  userId,
  isFemale,
  isUpdate,
  loading,
  error,
  onClose,
  onCancel,
  onSubmit,
}: TonightSetupModalProps) {
  const [draft, setDraft] = useState<TonightDraft>(createEmptyDraft())
  const [savingVenue, setSavingVenue] = useState(false)
  const [venueError, setVenueError] = useState('')
  const [showManual, setShowManual] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualAddress, setManualAddress] = useState('')
  const [manualType, setManualType] = useState('bar')

  const persistDraft = useCallback(
    (updater: TonightDraft | ((prev: TonightDraft) => TonightDraft)) => {
      setDraft((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        saveTonightDraft(userId, next)
        return next
      })
    },
    [userId]
  )

  useEffect(() => {
    if (!open) return
    const saved = loadTonightDraft(userId)
    if (saved) {
      setDraft(saved)
    } else {
      setDraft(createEmptyDraft())
    }
    setVenueError('')
    setShowManual(false)
    setManualName('')
    setManualAddress('')
    setManualType('bar')
  }, [open, userId])

  const handleCancel = () => {
    clearTonightDraft(userId)
    setDraft(createEmptyDraft())
    onCancel()
  }

  const confirmVenue = async (venue: SelectedVenue) => {
    setSavingVenue(true)
    setVenueError('')
    try {
      let lat = venue.latitude
      let lng = venue.longitude

      if (lat == null || lng == null || (lat === 0 && lng === 0)) {
        const coords = await geocodeAddress(venue.formattedAddress)
        if (!coords) {
          setVenueError('Could not locate that address. Try a different venue or full address.')
          setSavingVenue(false)
          return
        }
        lat = roundCoordinate(coords.lat)
        lng = roundCoordinate(coords.lng)
      }

      const toSave: SelectedVenue = { ...venue, latitude: lat, longitude: lng }
      const venueId = await saveVenueToDatabase(toSave, userId)
      const saved = { ...toSave, venueId }

      persistDraft((prev) => ({
        ...prev,
        selectedVenue: saved,
        searchQuery: saved.venueName,
      }))
    } catch (e) {
      setVenueError(e instanceof Error ? e.message : 'Failed to save venue')
    } finally {
      setSavingVenue(false)
    }
  }

  const handleSelectSuggestion = async (s: VenueSuggestion) => {
    const selected = suggestionToSelectedVenue(s)
    persistDraft((prev) => ({ ...prev, searchQuery: s.venueName, selectedVenue: selected }))
    await confirmVenue(selected)
  }

  const handleClearVenue = () => {
    persistDraft((prev) => ({ ...prev, selectedVenue: null, searchQuery: '' }))
  }

  const handleManualSave = async () => {
    if (!manualName.trim() || !manualAddress.trim()) return
    const selected: SelectedVenue = {
      venueName: manualName.trim(),
      formattedAddress: manualAddress.trim(),
      latitude: null,
      longitude: null,
      placeId: null,
      provider: 'manual',
      city: null,
      state: null,
      country: null,
      venueType: manualType,
      isManual: true,
      venueId: null,
      categoryLabel: 'Manual venue',
    }
    setShowManual(false)
    await confirmVenue(selected)
  }

  const goNext = () => {
    if (!draft.selectedVenue?.venueId) {
      setVenueError('Select a venue from suggestions or add one manually.')
      return
    }
    persistDraft((prev) => ({ ...prev, step: 2 }))
  }

  const handleSubmit = () => {
    if (!draft.selectedVenue?.venueId) return
    onSubmit({
      venueId: draft.selectedVenue.venueId,
      selectedVenue: draft.selectedVenue,
      intent: draft.intent,
      statusMessage: draft.statusMessage,
      duration: draft.duration,
      visibilityMode: isFemale ? draft.visibilityMode : 'likes_only',
    })
  }

  if (!open) return null

  const step = draft.step

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/75 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <div className="flex max-h-[min(90vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-tonight-border bg-tonight-card">
        <div className="flex items-center justify-between border-b border-tonight-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">
              {isUpdate ? 'Edit Tonight' : 'Turn on Tonight Mode'}
            </h2>
            <p className="text-xs text-tonight-muted mt-0.5">Step {step} of 2</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-tonight-muted hover:bg-tonight-border"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 px-5 pt-3">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-tonight-accent' : 'bg-tonight-border'}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-tonight-accent' : 'bg-tonight-border'}`} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {step === 1 && (
            <>
              <p className="text-sm text-tonight-muted">
                Where are you going tonight? We show the venue on the map — never your exact location.
              </p>

              <VenueAutocomplete
                value={draft.searchQuery}
                selectedVenue={draft.selectedVenue?.venueId ? draft.selectedVenue : null}
                onQueryChange={(q) => persistDraft((prev) => ({ ...prev, searchQuery: q }))}
                onSelect={handleSelectSuggestion}
                onClearSelection={handleClearVenue}
                disabled={savingVenue}
              />

              {draft.selectedVenue?.venueId && (
                <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs text-green-400">
                  Venue saved — your selection will persist if you leave and come back.
                </div>
              )}

              {savingVenue && (
                <p className="text-sm text-tonight-muted">Saving venue...</p>
              )}

              {!showManual && !draft.selectedVenue?.venueId && (
                <button
                  type="button"
                  onClick={() => setShowManual(true)}
                  className="text-sm text-tonight-accent underline min-h-[44px]"
                >
                  Can't find your venue? Add manually
                </button>
              )}

              {showManual && (
                <div className="space-y-3 rounded-2xl border border-tonight-border p-4">
                  <p className="text-sm font-medium">Manual venue</p>
                  <input
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Venue name"
                    className="field-input"
                  />
                  <input
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="Full address"
                    className="field-input"
                  />
                  <select
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value)}
                    className="field-input"
                  >
                    {VENUE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <Button variant="secondary" fullWidth onClick={() => setShowManual(false)}>
                      Cancel
                    </Button>
                    <Button
                      fullWidth
                      onClick={handleManualSave}
                      disabled={savingVenue || !manualName.trim() || !manualAddress.trim()}
                    >
                      Save manual venue
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              {draft.selectedVenue && (
                <div className="rounded-xl border border-tonight-border bg-tonight-bg p-3 text-sm">
                  <p className="font-medium">{draft.selectedVenue.venueName}</p>
                  <p className="text-xs text-tonight-muted mt-0.5">{draft.selectedVenue.formattedAddress}</p>
                </div>
              )}
              <Field label="Intent">
                <select
                  value={draft.intent}
                  onChange={(e) => persistDraft((prev) => ({ ...prev, intent: e.target.value as TonightIntent }))}
                  className="field-input"
                >
                  {Object.entries(INTENT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="Status message (optional)">
                <input
                  value={draft.statusMessage}
                  onChange={(e) => persistDraft((prev) => ({ ...prev, statusMessage: e.target.value }))}
                  placeholder="Open to grab a drink"
                  className="field-input"
                />
              </Field>
              <Field label="Visibility duration">
                <select
                  value={draft.duration}
                  onChange={(e) => persistDraft((prev) => ({ ...prev, duration: Number(e.target.value) }))}
                  className="field-input"
                >
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </Field>
              {isFemale && (
                <Field label="Who can see you?">
                  <select
                    value={draft.visibilityMode}
                    onChange={(e) => persistDraft((prev) => ({ ...prev, visibilityMode: e.target.value as VisibilityMode }))}
                    className="field-input"
                  >
                    <option value="invisible">{VISIBILITY_LABELS.invisible} — Nobody</option>
                    <option value="likes_only">{VISIBILITY_LABELS.likes_only} — Men I like</option>
                    <option value="venue_visible">{VISIBILITY_LABELS.venue_visible} — Same venue</option>
                  </select>
                </Field>
              )}
            </>
          )}

          {(error || venueError) && (
            <p className="text-sm text-red-400">{error || venueError}</p>
          )}
        </div>

        <div className="flex gap-3 border-t border-tonight-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {step === 1 ? (
            <>
              <Button variant="secondary" fullWidth onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                fullWidth
                onClick={goNext}
                disabled={!draft.selectedVenue?.venueId || savingVenue}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" fullWidth onClick={() => persistDraft((prev) => ({ ...prev, step: 1 }))}>
                Back
              </Button>
              <Button fullWidth onClick={handleSubmit} disabled={loading}>
                {loading ? 'Going live...' : isUpdate ? 'Update' : 'Go live'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-tonight-muted">{label}</span>
      {children}
    </label>
  )
}
