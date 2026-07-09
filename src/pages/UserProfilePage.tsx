import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Flag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ReportModal } from '../components/ReportModal'
import { calculateAge } from '../lib/utils'
import type { Profile, ProfilePhoto } from '../types'

export function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [photos, setPhotos] = useState<ProfilePhoto[]>([])
  const [showReport, setShowReport] = useState(false)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', id).single()
      setProfile(p as unknown as Profile)

      const { data: ph } = await supabase
        .from('profile_photos')
        .select('*')
        .eq('user_id', id)
        .order('sort_order')

      setPhotos(ph ?? [])

      if (user) {
        const { data: like } = await supabase
          .from('likes')
          .select('id')
          .eq('liker_id', user.id)
          .eq('liked_id', id)
          .maybeSingle()
        setLiked(!!like)
      }
    }

    load()
  }, [id, user])

  const handleLike = async () => {
    if (!user || !id) return
    await supabase.from('likes').insert({ liker_id: user.id, liked_id: id })
    setLiked(true)
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-tonight-accent border-t-transparent" />
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
          className="absolute left-4 top-4 rounded-full bg-black/50 p-2 backdrop-blur"
        >
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={() => setShowReport(true)}
          className="absolute right-4 top-4 rounded-full bg-black/50 p-2 backdrop-blur"
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

        {user && user.id !== id && !liked && (
          <button
            onClick={handleLike}
            className="mt-6 w-full rounded-xl bg-tonight-accent py-3.5 font-semibold hover:bg-tonight-accent-hover"
          >
            Like
          </button>
        )}

        {liked && (
          <p className="mt-6 text-center text-tonight-accent font-medium">You liked {profile.full_name}</p>
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
