import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Flag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ReportModal } from '../components/ReportModal'
import { Button } from '../components/Button'
import {
  getMatchId,
  getRelationshipStatus,
  likeUser,
  type RelationshipStatus,
} from '../lib/relationships'
import { calculateAge } from '../lib/utils'
import type { Profile, ProfilePhoto } from '../types'

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [photos, setPhotos] = useState<ProfilePhoto[]>([])
  const [showReport, setShowReport] = useState(false)
  const [status, setStatus] = useState<RelationshipStatus>('none')
  const [matchId, setMatchId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true)

    const { data: p } = await supabase.from('profiles').select('*').eq('id', id).single()
    if (!p) {
      setLoading(false)
      return
    }
    setProfile(p as unknown as Profile)

    const { data: ph } = await supabase
      .from('profile_photos')
      .select('*')
      .eq('user_id', id)
      .order('sort_order')
    setPhotos(ph ?? [])

    if (user && user.id !== id) {
      const rel = await getRelationshipStatus(id)
      setStatus(rel)
      if (rel === 'matched') {
        setMatchId(await getMatchId(id))
      }
    }

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [id, user])

  const handleLike = async () => {
    if (!user || !id) return
    setActionLoading(true)
    try {
      const { matched, matchId: newMatchId } = await likeUser(user.id, id)
      setStatus(matched ? 'matched' : 'i_liked_them')
      if (matched && newMatchId) {
        setMatchId(newMatchId)
        navigate(`/chat/${newMatchId}`)
      }
    } finally {
      setActionLoading(false)
    }
  }

  if (loading || !profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-tonight-accent border-t-transparent" />
      </div>
    )
  }

  if (status === 'blocked') {
    return (
      <div className="flex h-screen flex-col items-center justify-center px-6 text-center">
        <p className="text-tonight-muted">This profile is not available.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    )
  }

  const age = calculateAge(profile.date_of_birth)
  const primaryPhoto = photos.find((p) => p.is_primary)?.photo_url ?? photos[0]?.photo_url

  return (
    <div className="min-h-screen bg-tonight-bg pb-8">
      <div className="relative h-96 bg-tonight-border">
        {primaryPhoto ? (
          <img src={primaryPhoto} alt="" className="h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-tonight-bg via-transparent to-black/30" />
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 rounded-full bg-black/50 p-2 backdrop-blur min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={() => setShowReport(true)}
          className="absolute right-4 top-4 rounded-full bg-black/50 p-2 backdrop-blur min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <Flag size={18} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h1 className="text-2xl font-bold">
            {profile.full_name}{age ? `, ${age}` : ''}
          </h1>
          {profile.city && <p className="text-tonight-muted">{profile.city}</p>}
        </div>
      </div>

      <div className="px-5 py-5">
        {profile.bio && (
          <p className="text-tonight-muted leading-relaxed">{profile.bio}</p>
        )}

        {photos.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-tonight-muted">Photos</p>
            <div className="grid grid-cols-3 gap-2">
              {photos.slice(0, 5).map((p, i) => (
                <img
                  key={p.id}
                  src={p.photo_url}
                  alt=""
                  className={`rounded-xl object-cover ${
                    i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {user && user.id !== id && (
          <ProfileAction
            status={status}
            matchId={matchId}
            loading={actionLoading}
            onLike={handleLike}
            onMessage={() => matchId && navigate(`/chat/${matchId}`)}
          />
        )}
      </div>

      {showReport && (
        <ReportModal
          userId={id!}
          userName={profile.full_name ?? 'User'}
          onClose={() => setShowReport(false)}
          onBlocked={() => navigate(-1)}
        />
      )}
    </div>
  )
}

function ProfileAction({
  status,
  matchId,
  loading,
  onLike,
  onMessage,
}: {
  status: RelationshipStatus
  matchId: string | null
  loading: boolean
  onLike: () => void
  onMessage: () => void
}) {
  switch (status) {
    case 'matched':
      return (
        <Button fullWidth className="mt-6" onClick={onMessage} disabled={!matchId}>
          Message
        </Button>
      )
    case 'they_liked_me':
      return (
        <Button fullWidth className="mt-6" onClick={onLike} disabled={loading}>
          {loading ? 'Matching...' : 'Like Back'}
        </Button>
      )
    case 'i_liked_them':
      return (
        <div className="mt-6 rounded-2xl border border-tonight-border bg-tonight-card py-3.5 text-center font-medium text-tonight-muted">
          Liked — waiting for them
        </div>
      )
    default:
      return (
        <Button fullWidth className="mt-6" onClick={onLike} disabled={loading}>
          {loading ? 'Liking...' : 'Like'}
        </Button>
      )
  }
}
