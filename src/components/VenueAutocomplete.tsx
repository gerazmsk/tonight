import { useEffect, useRef, useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { searchVenues, type VenueSuggestion } from '../lib/venueSearch'
import type { SelectedVenue } from '../lib/tonightDraft'

interface VenueAutocompleteProps {
  value: string
  selectedVenue: SelectedVenue | null
  onQueryChange: (query: string) => void
  onSelect: (suggestion: VenueSuggestion) => void
  onClearSelection: () => void
  disabled?: boolean
}

export function VenueAutocomplete({
  value,
  selectedVenue,
  onQueryChange,
  onSelect,
  onClearSelection,
  disabled,
}: VenueAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<VenueSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedVenue) {
      setSuggestions([])
      setOpen(false)
      return
    }

    const q = value.trim()
    if (q.length < 2) {
      setSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      const results = await searchVenues(q)
      setSuggestions(results)
      setLoading(false)
      setOpen(results.length > 0)
    }, 300)

    return () => clearTimeout(timer)
  }, [value, selectedVenue])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (selectedVenue) {
    return (
      <div className="rounded-2xl border border-tonight-accent/40 bg-tonight-accent/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold truncate">{selectedVenue.venueName}</p>
            <p className="text-sm text-tonight-muted mt-0.5 line-clamp-2">
              {selectedVenue.formattedAddress}
            </p>
            {(selectedVenue.categoryLabel || selectedVenue.isManual) && (
              <p className="text-xs text-tonight-accent mt-1 capitalize">
                {selectedVenue.isManual ? 'Manual venue' : selectedVenue.categoryLabel}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClearSelection}
            disabled={disabled}
            className="shrink-0 text-xs text-tonight-muted hover:text-white underline min-h-[44px] disabled:opacity-50"
          >
            Change
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={wrapRef} className="relative">
      <label className="mb-1.5 block text-sm text-tonight-muted">
        Search for a bar, restaurant, or venue *
      </label>
      <div className="relative">
        <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-tonight-muted pointer-events-none" />
        <input
          type="search"
          value={value}
          onChange={(e) => {
            onQueryChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Komodo Miami, Sweet Liberty..."
          disabled={disabled}
          autoComplete="off"
          enterKeyHint="search"
          className="field-input pl-10 pr-10"
        />
        {loading && (
          <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-tonight-muted" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border border-tonight-border bg-tonight-card shadow-2xl">
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button
                type="button"
                onClick={() => {
                  onSelect(s)
                  setOpen(false)
                }}
                className="flex w-full flex-col items-start gap-0.5 border-b border-tonight-border/50 px-4 py-3 text-left last:border-0 hover:bg-tonight-border/30 min-h-[56px] active:bg-tonight-border/50"
              >
                <span className="font-medium text-sm">{s.venueName}</span>
                <span className="text-xs text-tonight-muted line-clamp-2">{s.formattedAddress}</span>
                {(s.city || s.categoryLabel) && (
                  <span className="text-[10px] text-tonight-accent capitalize">
                    {[s.categoryLabel, s.city, s.state].filter(Boolean).join(' · ')}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
