import { supabase } from './supabase'

export type RelationshipStatus =
  | 'none'
  | 'they_liked_me'
  | 'i_liked_them'
  | 'matched'
  | 'blocked'
  | 'self'

export interface LikeProfile {
  user_id: string
  full_name: string | null
  date_of_birth: string | null
  bio: string | null
  city: string | null
  is_verified: boolean
  primary_photo: string | null
  liked_at: string
}

export interface MatchRow {
  match_id: string
  other_user_id: string
  full_name: string | null
  date_of_birth: string | null
  city: string | null
  primary_photo: string | null
  last_message_text: string | null
  last_message_at: string | null
  last_message_sender_id: string | null
  unread_count: number
  matched_at: string
}

export async function getRelationshipStatus(otherUserId: string): Promise<RelationshipStatus> {
  const { data } = await supabase.rpc('get_relationship_status', { p_other_user_id: otherUserId })
  return (data as RelationshipStatus) ?? 'none'
}

export async function getMatchId(otherUserId: string): Promise<string | null> {
  const { data } = await supabase.rpc('get_match_id', { p_other_user_id: otherUserId })
  return data as string | null
}

export async function likeUser(likerId: string, likedId: string): Promise<{ matched: boolean; matchId: string | null }> {
  const { error } = await supabase.from('likes').insert({ liker_id: likerId, liked_id: likedId })
  if (error && !error.message.includes('duplicate')) {
    throw error
  }

  // Brief pause for trigger to create match
  await new Promise((r) => setTimeout(r, 300))
  const matchId = await getMatchId(likedId)
  return { matched: !!matchId, matchId }
}

export async function fetchLikesYou(): Promise<LikeProfile[]> {
  const { data } = await supabase.rpc('get_likes_you')
  return (data as LikeProfile[]) ?? []
}

export async function fetchLikedByMe(): Promise<LikeProfile[]> {
  const { data } = await supabase.rpc('get_liked_by_me')
  return (data as LikeProfile[]) ?? []
}

export async function fetchMyMatches(): Promise<MatchRow[]> {
  const { data } = await supabase.rpc('get_my_matches')
  return (data as MatchRow[]) ?? []
}
