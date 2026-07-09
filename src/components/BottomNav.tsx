import { NavLink } from 'react-router-dom'
import { Compass, Moon, Heart, User } from 'lucide-react'

const links = [
  { to: '/discover', icon: Compass, label: 'Discover' },
  { to: '/tonight', icon: Moon, label: 'Tonight' },
  { to: '/connections', icon: Heart, label: 'Connections' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-tonight-border bg-tonight-bg/98 backdrop-blur-xl"
      style={{ paddingBottom: 'var(--nav-safe-bottom)' }}
    >
      <div
        className="mx-auto flex max-w-lg items-stretch justify-around px-1"
        style={{ minHeight: 'var(--nav-bar-height)' }}
      >
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex flex-1 flex-col items-center justify-center gap-0.5',
                'min-h-[48px] min-w-[56px] px-1 py-2',
                'text-[10px] font-medium transition-colors touch-manipulation',
                isActive ? 'text-tonight-accent' : 'text-tonight-muted active:text-white',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.25 : 1.75} />
                <span className="truncate max-w-full">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
