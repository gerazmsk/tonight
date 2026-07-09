import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, LogOut, Shield, Eye, UserX } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { PhotoGallery } from '../components/PhotoGallery'
import { calculateAge, VISIBILITY_LABELS } from '../lib/utils'
import type { ProfilePhoto, VisibilityMode } from '../types'

export function ProfilePage() {
  const { profile, signOut, refreshProfile } = useAuth()
  const [photos, setPhotos] = useState<ProfilePhoto[]>([])
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>(
    profile?.visibility_mode ?? 'likes_only'
  )

  const loadPhotos = async () => {
    if (!profile) return
    const { data } = await supabase
      .from('profile_photos')
      .select('*')
      .eq('user_id', profile.id)
      .order('sort_order')
    setPhotos((data as ProfilePhoto[]) ?? [])
  }

  useEffect(() => {
    if (!profile) return
    setBio(profile.bio ?? '')
    setCity(profile.city ?? '')
    setVisibilityMode(profile.visibility_mode)
    loadPhotos()
  }, [profile])

  const saveProfile = async () => {
    if (!profile) return
    await supabase.from('profiles').update({
      bio: bio.trim() || null,
      city: city.trim(),
      visibility_mode: visibilityMode,
    }).eq('id', profile.id)
    await refreshProfile()
    setEditing(false)
  }

  const age = calculateAge(profile?.date_of_birth ?? null)

  return (
    <div className="px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Profile</h1>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-tonight-accent font-medium"
          >
            Edit
          </button>
        )}
      </div>

      {profile && (
        <PhotoGallery
          userId={profile.id}
          photos={photos}
          editing={editing}
          onPhotosChange={setPhotos}
        />
      )}

      <div className="mt-5 text-center">
        <h2 className="text-xl font-semibold">
          {profile?.full_name}{age ? `, ${age}` : ''}
        </h2>
        {profile?.city && <p className="text-sm text-tonight-muted">{profile.city}</p>}
      </div>

      {editing ? (
        <div className="mt-6 space-y-3">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-tonight-border bg-tonight-card px-3 py-2.5 resize-none"
            placeholder="Bio"
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border border-tonight-border bg-tonight-card px-3 py-2.5"
            placeholder="City"
          />
          {profile?.gender === 'female' && (
            <select
              value={visibilityMode}
              onChange={(e) => setVisibilityMode(e.target.value as VisibilityMode)}
              className="w-full rounded-xl border border-tonight-border bg-tonight-card px-3 py-2.5"
            >
              {Object.entries(VISIBILITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditing(false)
                if (profile) {
                  setBio(profile.bio ?? '')
                  setCity(profile.city ?? '')
                  setVisibilityMode(profile.visibility_mode)
                  loadPhotos()
                }
              }}
              className="flex-1 rounded-xl border border-tonight-border py-2.5"
            >
              Cancel
            </button>
            <button onClick={saveProfile} className="flex-1 rounded-xl bg-tonight-accent py-2.5 font-medium">
              Save
            </button>
          </div>
        </div>
      ) : (
        profile?.bio && (
          <p className="mt-4 text-center text-sm text-tonight-muted leading-relaxed">{profile.bio}</p>
        )
      )}

      <div className="mt-8 space-y-1">
        <MenuItem icon={<UserX size={18} />} label="Edit Profile" onClick={() => setEditing(true)} />
        {profile?.gender === 'female' && (
          <MenuItem
            icon={<Eye size={18} />}
            label="My Visibility Settings"
            subtitle={VISIBILITY_LABELS[profile.visibility_mode]}
            onClick={() => setEditing(true)}
          />
        )}
        <MenuItem icon={<Shield size={18} />} label="Safety & Privacy" to="/profile" />
        <MenuItem icon={<LogOut size={18} />} label="Log Out" onClick={signOut} danger />
      </div>
    </div>
  )
}

function MenuItem({
  icon,
  label,
  subtitle,
  to,
  onClick,
  danger,
}: {
  icon: React.ReactNode
  label: string
  subtitle?: string
  to?: string
  onClick?: () => void
  danger?: boolean
}) {
  const className = `flex w-full items-center gap-3 rounded-xl border border-tonight-border bg-tonight-card p-4 text-left hover:border-tonight-accent/30 transition-colors ${
    danger ? 'text-red-400' : ''
  }`

  const content = (
    <>
      <span className="text-tonight-accent">{icon}</span>
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        {subtitle && <p className="text-xs text-tonight-muted">{subtitle}</p>}
      </div>
      <ChevronRight size={18} className="text-tonight-muted" />
    </>
  )

  if (to) return <Link to={to} className={className}>{content}</Link>
  return <button onClick={onClick} className={className}>{content}</button>
}
