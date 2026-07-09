import { NavLink } from 'react-router-dom'
import { Compass, Moon, MessageCircle, User } from 'lucide-react'

const links = [
  { to: '/discover', icon: Compass, label: 'Discover' },
  { to: '/tonight', icon: Moon, label: 'Tonight' },
  { to: '/matches', icon: MessageCircle, label: 'Matches' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-tonight-border bg-tonight-bg/95 backdrop-blur-lg safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors ${
                isActive ? 'text-tonight-accent' : 'text-tonight-muted hover:text-white'
              }`
            }
          >
            <Icon size={22} strokeWidth={1.75} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
