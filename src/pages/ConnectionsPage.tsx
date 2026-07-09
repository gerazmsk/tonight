import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { LikeCard } from '../components/LikeCard'
import { Button } from '../components/Button'
import {
  fetchLikedByMe,
  fetchLikesYou,
  fetchMyMatches,
  likeUser,
  type LikeProfile,
  type MatchRow,
} from '../lib/relationships'
import { calculateAge, formatRelativeTime } from '../lib/utils'

type Tab = 'likes_you' | 'liked_by_me' | 'matches'

const TABS: { id: Tab; label: string }[] = [
  { id: 'likes_you', label: 'Likes You' },
  { id: 'liked_by_me', label: 'Liked by Me' },
  { id: 'matches', label: 'Matches' },
]

export function ConnectionsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') as Tab) || 'likes_you'

  const [likesYou, setLikesYou] = useState<LikeProfile[]>([])
  const [likedByMe, setLikedByMe] = useState<LikeProfile[]>([])
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [likingId, setLikingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [you, me, m] = await Promise.all([
      fetchLikesYou(),
      fetchLikedByMe(),
      fetchMyMatches(),
    ])
    setLikesYou(you)
    setLikedByMe(me)
    setMatches(m)
    setLoading(false)
  }, [user])

  useEffect(() => {
    load()
    if (!user) return
    const channel = supabase
      .channel('connections-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load, user])

  const setTab = (t: Tab) => setSearchParams({ tab: t })

  const handleLikeBack = async (profile: LikeProfile) => {
    if (!user) return
    setLikingId(profile.user_id)
    try {
      const { matched, matchId } = await likeUser(user.id, profile.user_id)
      await load()
      if (matched && matchId) {
        navigate(`/chat/${matchId}`)
      }
    } finally {
      setLikingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-tonight-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="px-4 py-4">
      <h1 className="mb-4 text-xl font-semibold">Connections</h1>

      <div className="mb-4 flex gap-1 rounded-xl border border-tonight-border bg-tonight-card p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg py-2.5 text-xs font-medium transition-colors min-h-[40px] ${
              tab === t.id
                ? 'bg-tonight-accent text-white'
                : 'text-tonight-muted hover:text-white'
            }`}
          >
            {t.label}
            {t.id === 'likes_you' && likesYou.length > 0 && (
              <span className="ml-1 opacity-80">({likesYou.length})</span>
            )}
            {t.id === 'matches' && matches.length > 0 && (
              <span className="ml-1 opacity-80">({matches.length})</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'likes_you' && (
        <LikesYouTab
          profiles={likesYou}
          likingId={likingId}
          onLikeBack={handleLikeBack}
        />
      )}
      {tab === 'liked_by_me' && <LikedByMeTab profiles={likedByMe} />}
      {tab === 'matches' && <MatchesTab matches={matches} />}
    </div>
  )
}

function LikesYouTab({
  profiles,
  likingId,
  onLikeBack,
}: {
  profiles: LikeProfile[]
  likingId: string | null
  onLikeBack: (p: LikeProfile) => void
}) {
  if (profiles.length === 0) {
    return (
      <EmptyState
        title="No likes yet"
        text="When someone likes you, they'll show up here."
      />
    )
  }
  return (
    <div className="space-y-2">
      <p className="mb-3 text-sm text-tonight-muted">
        People who liked you — tap Like Back to match.
      </p>
      {profiles.map((p) => (
        <LikeCard
          key={p.user_id}
          profile={p}
          action="like_back"
          onLikeBack={() => onLikeBack(p)}
          loading={likingId === p.user_id}
        />
      ))}
    </div>
  )
}

function LikedByMeTab({ profiles }: { profiles: LikeProfile[] }) {
  if (profiles.length === 0) {
    return (
      <EmptyState
        title="No pending likes"
        text="Profiles you liked will appear here until they like you back."
      />
    )
  }
  return (
    <div className="space-y-2">
      <p className="mb-3 text-sm text-tonight-muted">Waiting for them to like you back.</p>
      {profiles.map((p) => (
        <LikeCard key={p.user_id} profile={p} action="none" />
      ))}
    </div>
  )
}

function MatchesTab({ matches }: { matches: MatchRow[] }) {
  if (matches.length === 0) {
    return (
      <EmptyState
        title="No matches yet"
        text="When you and someone like each other, you'll match here."
      />
    )
  }
  return (
    <div className="space-y-2">
      {matches.map((m) => {
        const age = calculateAge(m.date_of_birth)
        return (
          <div
            key={m.match_id}
            className="rounded-2xl border border-tonight-border bg-tonight-card p-3"
          >
            <div className="flex items-center gap-3">
              <Link to={`/user/${m.other_user_id}`} className="shrink-0">
                <div className="h-14 w-14 overflow-hidden rounded-full bg-tonight-border">
                  {m.primary_photo ? (
                    <img src={m.primary_photo} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium truncate">
                    {m.full_name}{age ? `, ${age}` : ''}
                  </p>
                  {m.last_message_at && (
                    <span className="text-xs text-tonight-muted shrink-0">
                      {formatRelativeTime(m.last_message_at)}
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-tonight-muted">
                  {m.last_message_text ?? 'Say hello!'}
                </p>
              </div>
              {m.unread_count > 0 && (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-tonight-accent text-xs font-bold">
                  {m.unread_count}
                </span>
              )}
            </div>
            <Link to={`/chat/${m.match_id}`} className="mt-3 block">
              <Button fullWidth variant="secondary" className="!min-h-[44px]">
                <MessageCircle size={16} /> Message
              </Button>
            </Link>
          </div>
        )
      })}
    </div>
  )
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="py-12 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-2 text-sm text-tonight-muted">{text}</p>
    </div>
  )
}