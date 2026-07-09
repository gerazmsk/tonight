export function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null
  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}

export function isAdult(dateOfBirth: string | null): boolean {
  const age = calculateAge(dateOfBirth)
  return age !== null && age >= 18
}

export function formatTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `${hours}h ${minutes}m left`
  return `${minutes}m left`
}

export function formatRelativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100
}

export const GENDER_LABELS: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  non_binary: 'Non-binary',
  other: 'Other',
}

export const INTENT_LABELS: Record<string, string> = {
  dating: 'Dating',
  drinks: 'Drinks',
  friends: 'Friends',
  networking: 'Networking',
  just_browsing: 'Just browsing',
}

export const VISIBILITY_LABELS: Record<string, string> = {
  invisible: 'Invisible',
  likes_only: 'Likes Only',
  venue_visible: 'Venue Visible',
}

export const REPORT_REASONS = [
  { value: 'fake_profile', label: 'Fake profile' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'inappropriate_behavior', label: 'Inappropriate behavior' },
  { value: 'safety_concern', label: 'Safety concern' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' },
] as const

export const VENUE_TYPES = [
  { value: 'bar', label: 'Bar' },
  { value: 'lounge', label: 'Lounge' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'coffee_shop', label: 'Coffee shop' },
  { value: 'club', label: 'Club' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
] as const

export const DURATION_OPTIONS = [
  { value: 1, label: '1 hour' },
  { value: 2, label: '2 hours' },
  { value: 3, label: '3 hours' },
  { value: 4, label: '4 hours' },
] as const
