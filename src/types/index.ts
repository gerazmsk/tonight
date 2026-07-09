export type Gender = 'male' | 'female' | 'non_binary' | 'other'
export type InterestedIn = 'male' | 'female' | 'everyone'
export type VisibilityMode = 'invisible' | 'likes_only' | 'venue_visible'
export type VenueType = 'bar' | 'lounge' | 'restaurant' | 'coffee_shop' | 'club' | 'event' | 'other'
export type TonightIntent = 'dating' | 'drinks' | 'friends' | 'networking' | 'just_browsing'
export type ReportReason = 'fake_profile' | 'harassment' | 'inappropriate_behavior' | 'safety_concern' | 'spam' | 'other'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  gender: Gender | null
  interested_in: InterestedIn | null
  date_of_birth: string | null
  bio: string | null
  city: string | null
  profile_completed: boolean
  is_verified: boolean
  is_suspended: boolean
  visibility_mode: VisibilityMode
  created_at: string
  updated_at: string
}

export interface ProfilePhoto {
  id: string
  user_id: string
  photo_url: string
  sort_order: number
  is_primary: boolean
  created_at: string
}

export interface Like {
  id: string
  liker_id: string
  liked_id: string
  created_at: string
}

export interface Pass {
  id: string
  passer_id: string
  passed_id: string
  created_at: string
}

export interface Match {
  id: string
  user_one_id: string
  user_two_id: string
  created_at: string
  unmatched_at: string | null
}

export interface Message {
  id: string
  match_id: string
  sender_id: string
  message_text: string
  created_at: string
  read_at: string | null
}

export interface Venue {
  id: string
  name: string
  type: VenueType
  city: string
  address: string | null
  latitude: number | null
  longitude: number | null
  created_by: string | null
  created_at: string
}

export interface TonightSession {
  id: string
  user_id: string
  venue_id: string
  status: string
  intent: TonightIntent
  status_message: string | null
  visibility_mode: VisibilityMode
  approximate_latitude: number | null
  approximate_longitude: number | null
  starts_at: string
  expires_at: string
  ended_at: string | null
  created_at: string
  venue?: { name: string; type: string; city: string }
}

export interface Report {
  id: string
  reporter_id: string
  reported_user_id: string
  reason: ReportReason
  details: string | null
  status: string
  created_at: string
  reviewed_at: string | null
}

export interface Block {
  id: string
  blocker_id: string
  blocked_id: string
  created_at: string
}

export interface DiscoverProfile {
  id: string
  full_name: string | null
  gender: Gender | null
  date_of_birth: string | null
  bio: string | null
  city: string | null
  is_verified: boolean
  primary_photo: string | null
}

export interface VenueSummary {
  venue_id: string
  venue_name: string
  venue_type: string
  city: string
  open_count: number
}

export interface VenueProfile extends DiscoverProfile {
  user_id: string
  intent: TonightIntent
  status_message: string | null
  expires_at: string
}

export interface MatchWithProfile {
  id: string
  created_at: string
  other_user: {
    id: string
    full_name: string | null
    primary_photo: string | null
  }
  last_message?: Message | null
  unread_count: number
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; email: string }; Update: Partial<Profile> }
      profile_photos: { Row: ProfilePhoto; Insert: Omit<ProfilePhoto, 'id' | 'created_at'> & { id?: string }; Update: Partial<ProfilePhoto> }
      likes: { Row: Like; Insert: Omit<Like, 'id' | 'created_at'>; Update: Partial<Like> }
      passes: { Row: Pass; Insert: Omit<Pass, 'id' | 'created_at'>; Update: Partial<Pass> }
      matches: { Row: Match; Insert: Omit<Match, 'id' | 'created_at'>; Update: Partial<Match> }
      messages: { Row: Message; Insert: Omit<Message, 'id' | 'created_at' | 'read_at'>; Update: Partial<Message> }
      venues: { Row: Venue; Insert: Omit<Venue, 'id' | 'created_at'> & { id?: string }; Update: Partial<Venue> }
      tonight_sessions: { Row: TonightSession; Insert: Omit<TonightSession, 'id' | 'created_at' | 'venue'>; Update: Partial<TonightSession> }
      visibility_reveals: { Row: { id: string; revealer_id: string; viewer_id: string; reason: string; created_at: string }; Insert: { revealer_id: string; viewer_id: string; reason?: string }; Update: never }
      reports: { Row: Report; Insert: Omit<Report, 'id' | 'created_at' | 'status' | 'reviewed_at'>; Update: Partial<Report> }
      blocks: { Row: Block; Insert: Omit<Block, 'id' | 'created_at'>; Update: never }
      admin_users: { Row: { id: string; email: string; created_at: string }; Insert: { email: string }; Update: never }
    }
    Functions: {
      get_discover_profiles: { Args: Record<string, never>; Returns: DiscoverProfile[] }
      get_active_venues: { Args: { p_city?: string | null }; Returns: VenueSummary[] }
      get_venue_profiles: { Args: { p_venue_id: string }; Returns: VenueProfile[] }
      get_admin_stats: { Args: Record<string, never>; Returns: Record<string, number> }
      calculate_age: { Args: { dob: string }; Returns: number }
      is_admin: { Args: Record<string, never>; Returns: boolean }
    }
  }
}
