import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'
import { INTENT_LABELS, VISIBILITY_LABELS, VENUE_TYPES, DURATION_OPTIONS } from '../lib/utils'
import type { VisibilityMode, TonightIntent } from '../types'

interface TonightSetupModalProps {
  open: boolean
  isFemale: boolean
  isUpdate: boolean
  loading: boolean
  error: string
  onClose: () => void
  onSubmit: (data: TonightSetupData) => void
}

export interface TonightSetupData {
  venueName: string
  venueAddress: string
  venueType: string
  intent: TonightIntent
  statusMessage: string
  duration: number
  visibilityMode: VisibilityMode
}

export function TonightSetupModal({
  open,
  isFemale,
  isUpdate,
  loading,
  error,
  onClose,
  onSubmit,
}: TonightSetupModalProps) {
  const [step, setStep] = useState(1)
  const [venueName, setVenueName] = useState('')
  const [venueAddress, setVenueAddress] = useState('')
  const [venueType, setVenueType] = useState('bar')
  const [intent, setIntent] = useState<TonightIntent>('drinks')
  const [statusMessage, setStatusMessage] = useState('')
  const [duration, setDuration] = useState(2)
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>('likes_only')

  if (!open) return null

  const handleClose = () => {
    setStep(1)
    onClose()
  }

  const goNext = () => {
    if (!venueName.trim()) return
    if (!venueAddress.trim()) return
    setStep(2)
  }

  const handleSubmit = () => {
    onSubmit({
      venueName: venueName.trim(),
      venueAddress: venueAddress.trim(),
      venueType,
      intent,
      statusMessage: statusMessage.trim(),
      duration,
      visibilityMode: isFemale ? visibilityMode : 'likes_only',
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/75 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <div className="flex max-h-[min(90vh,640px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-tonight-border bg-tonight-card">
        <div className="flex items-center justify-between border-b border-tonight-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">
              {isUpdate ? 'Edit Tonight' : 'Turn on Tonight Mode'}
            </h2>
            <p className="text-xs text-tonight-muted mt-0.5">Step {step} of 2</p>
          </div>
          <button
            onClick={handleClose}
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
              <Field label="Venue name" required>
                <input
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="Komodo Miami"
                  className="field-input"
                />
              </Field>
              <Field label="Venue address" required>
                <input
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  placeholder="801 Brickell Ave, Miami, FL"
                  className="field-input"
                />
              </Field>
              <Field label="Venue type">
                <select
                  value={venueType}
                  onChange={(e) => setVenueType(e.target.value)}
                  className="field-input"
                >
                  {VENUE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Intent">
                <select
                  value={intent}
                  onChange={(e) => setIntent(e.target.value as TonightIntent)}
                  className="field-input"
                >
                  {Object.entries(INTENT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="Status message (optional)">
                <input
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  placeholder="Open to grab a drink"
                  className="field-input"
                />
              </Field>
              <Field label="Visibility duration">
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
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
                    value={visibilityMode}
                    onChange={(e) => setVisibilityMode(e.target.value as VisibilityMode)}
                    className="field-input"
                  >
                    <option value="invisible">{VISIBILITY_LABELS.invisible} — Nobody</option>
                    <option value="likes_only">{VISIBILITY_LABELS.likes_only} — Men I like</option>
                    <option value="venue_visible">{VISIBILITY_LABELS.venue_visible} — Same venue</option>
                  </select>
                  <p className="mt-2 text-xs text-tonight-muted leading-relaxed">
                    Women are hidden by default. Only people you choose can see your live presence.
                  </p>
                </Field>
              )}
            </>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="flex gap-3 border-t border-tonight-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {step === 1 ? (
            <>
              <Button variant="secondary" fullWidth onClick={handleClose}>
                Cancel
              </Button>
              <Button
                fullWidth
                onClick={goNext}
                disabled={!venueName.trim() || !venueAddress.trim()}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" fullWidth onClick={() => setStep(1)}>
                Back
              </Button>
              <Button fullWidth onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : isUpdate ? 'Update' : 'Go live'}
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
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-tonight-muted">
        {label}{required && ' *'}
      </span>
      {children}
    </label>
  )
}
