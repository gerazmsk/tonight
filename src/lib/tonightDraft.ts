import type { TonightIntent, VisibilityMode } from '../types'

export interface SelectedVenue {
  venueName: string
  formattedAddress: string
  latitude: number | null
  longitude: number | null
  placeId: string | null
  provider: string | null
  city: string | null
  state: string | null
  country: string | null
  venueType: string
  isManual: boolean
  venueId: string | null
  categoryLabel?: string | null
}

export interface TonightDraft {
  step: 1 | 2
  searchQuery: string
  selectedVenue: SelectedVenue | null
  intent: TonightIntent
  statusMessage: string
  duration: number
  visibilityMode: VisibilityMode
  updatedAt: string
}

const DRAFT_VERSION = 1

function draftKey(userId: string) {
  return `tonight_draft_v${DRAFT_VERSION}_${userId}`
}

export function loadTonightDraft(userId: string): TonightDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as TonightDraft
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

export function saveTonightDraft(userId: string, draft: TonightDraft) {
  try {
    localStorage.setItem(
      draftKey(userId),
      JSON.stringify({ ...draft, updatedAt: new Date().toISOString() })
    )
  } catch {
    // Storage full or private mode
  }
}

export function clearTonightDraft(userId: string) {
  try {
    localStorage.removeItem(draftKey(userId))
  } catch {
    // ignore
  }
}

export function hasTonightDraft(userId: string): boolean {
  return loadTonightDraft(userId) != null
}

export function createEmptyDraft(): TonightDraft {
  return {
    step: 1,
    searchQuery: '',
    selectedVenue: null,
    intent: 'drinks',
    statusMessage: '',
    duration: 2,
    visibilityMode: 'likes_only',
    updatedAt: new Date().toISOString(),
  }
}
