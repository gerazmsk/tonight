import { Link } from 'react-router-dom'
import { BadgeCheck } from 'lucide-react'
import { calculateAge } from '../lib/utils'
import { Button } from './Button'
import type { LikeProfile } from '../lib/relationships'

interface LikeCardProps {
  profile: LikeProfile
  action?: 'like_back' | 'view' | 'none'
  onLikeBack?: () => void
  loading?: boolean
}

export function LikeCard({ profile, action = 'view', onLikeBack, loading }: LikeCardProps) {
  const age = calculateAge(profile.date_of_birth)

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-tonight-border bg-tonight-card p-3 min-h-[72px]">
      <Link to={`/user/${profile.user_id}`} className="shrink-0">
        <div className="h-14 w-14 overflow-hidden rounded-full bg-tonight-border">
          {profile.primary_photo ? (
            <img src={profile.primary_photo} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
      </Link>
      <Link to={`/user/${profile.user_id}`} className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="font-medium truncate">
            {profile.full_name}{age ? `, ${age}` : ''}
          </p>
          {profile.is_verified && <BadgeCheck size={14} className="text-blue-400 shrink-0" />}
        </div>
        {profile.city && <p className="text-xs text-tonight-muted truncate">{profile.city}</p>}
        {profile.bio && <p className="text-xs text-tonight-muted line-clamp-1 mt-0.5">{profile.bio}</p>}
      </Link>
      {action === 'like_back' && onLikeBack && (
        <Button className="!min-h-[40px] !px-4 shrink-0" onClick={onLikeBack} disabled={loading}>
          {loading ? '...' : 'Like Back'}
        </Button>
      )}
    </div>
  )
}
