import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { UserCard } from '../components/UserCard'
import type { VenueProfile } from '../types'

export function VenueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [venueName, setVenueName] = useState('')
  const [profiles, setProfiles] = useState<VenueProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      const { data: venue } = await supabase.from('venues').select('name').eq('id', id).single()
      setVenueName(venue?.name ?? 'Venue')

      const { data } = await supabase.rpc('get_venue_profiles', { p_venue_id: id })
      setProfiles((data as VenueProfile[] | null) ?? [])
      setLoading(false)
    }

    load()
  }, [id])

  const handleLike = async (profile: VenueProfile) => {
    if (!user) return
    await supabase.from('likes').insert({ liker_id: user.id, liked_id: profile.user_id ?? profile.id })
    navigate(`/user/${profile.user_id ?? profile.id}`)
  }

  return (
    <div className="min-h-screen bg-tonight-bg px-4 py-5 pb-24">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-tonight-muted hover:text-white">
        <ArrowLeft size={18} /> Back
      </button>

      <h1 className="text-xl font-semibold">{venueName}</h1>
      <p className="mt-1 text-sm text-tonight-muted">
        {profiles.length} {profiles.length === 1 ? 'person' : 'people'} open to meet tonight
      </p>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-tonight-accent border-t-transparent" />
        </div>
      ) : profiles.length === 0 ? (
        <p className="mt-8 text-center text-tonight-muted">No visible profiles at this venue.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {profiles.map((p) => (
            <UserCard
              key={p.user_id ?? p.id}
              profile={p}
              compact
              onLike={() => handleLike(p)}
              onView={() => navigate(`/user/${p.user_id ?? p.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
