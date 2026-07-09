import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { UserCard } from '../components/UserCard'
import { Button } from '../components/Button'
import type { DiscoverProfile } from '../types'

export function DiscoverPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadProfiles = async () => {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_discover_profiles')
    if (!error && data) {
      setProfiles(data as DiscoverProfile[])
      setIndex(0)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadProfiles()
  }, [])

  const current = profiles[index]

  const handleLike = async () => {
    if (!user || !current) return
    await supabase.from('likes').insert({ liker_id: user.id, liked_id: current.id })
    setIndex((i) => i + 1)
  }

  const handlePass = async () => {
    if (!user || !current) return
    await supabase.from('passes').insert({ passer_id: user.id, passed_id: current.id })
    setIndex((i) => i + 1)
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-tonight-accent border-t-transparent" />
      </div>
    )
  }

  if (!current) {
    return (
      <div className="px-5 py-12 text-center">
        <h1 className="text-xl font-semibold">Discover</h1>
        <p className="mt-4 text-tonight-muted">No more profiles right now. Check back later!</p>
        <Button className="mt-6" onClick={loadProfiles}>Refresh</Button>
      </div>
    )
  }

  return (
    <div className="px-4 py-5">
      <h1 className="mb-4 text-xl font-semibold">Discover</h1>
      <UserCard
        profile={current}
        onLike={handleLike}
        onPass={handlePass}
        onView={() => navigate(`/user/${current.id}`)}
      />
      <p className="mt-3 text-center text-xs text-tonight-muted">
        {profiles.length - index} profiles remaining
      </p>
    </div>
  )
}
