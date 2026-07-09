import { BadgeCheck } from 'lucide-react'
import { calculateAge } from '../lib/utils'
import { Button } from './Button'
import type { DiscoverProfile } from '../types'

interface UserCardProps {
  profile: DiscoverProfile
  onLike?: () => void
  onPass?: () => void
  onView?: () => void
  compact?: boolean
}

export function UserCard({ profile, onLike, onPass, onView, compact }: UserCardProps) {
  const age = calculateAge(profile.date_of_birth)

  return (
    <div className={`overflow-hidden rounded-2xl bg-tonight-card border border-tonight-border ${compact ? '' : 'shadow-xl'}`}>
      <div
        className={`relative ${compact ? 'h-48' : 'h-80'} bg-tonight-border cursor-pointer`}
        onClick={onView}
      >
        {profile.primary_photo ? (
          <img src={profile.primary_photo} alt={profile.full_name ?? ''} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-tonight-muted">No photo</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold">
              {profile.full_name}{age ? `, ${age}` : ''}
            </h3>
            {profile.is_verified && <BadgeCheck size={18} className="text-blue-400" />}
          </div>
          {profile.city && <p className="text-sm text-tonight-muted">{profile.city}</p>}
        </div>
      </div>
      {!compact && profile.bio && (
        <p className="px-4 py-3 text-sm text-tonight-muted line-clamp-2">{profile.bio}</p>
      )}
      {(onLike || onPass) && (
        <div className="flex gap-3 p-4 pt-2">
          {onPass && (
            <Button variant="secondary" className="flex-1" onClick={onPass}>
              Pass
            </Button>
          )}
          {onLike && (
            <Button className="flex-1" onClick={onLike}>
              Like
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
