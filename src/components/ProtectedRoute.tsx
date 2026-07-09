import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute({ requireOnboarding = true }: { requireOnboarding?: boolean }) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-tonight-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-tonight-accent border-t-transparent" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (requireOnboarding && profile && !profile.profile_completed) {
    return <Navigate to="/onboarding" replace />
  }

  if (!requireOnboarding && profile?.profile_completed) {
    return <Navigate to="/discover" replace />
  }

  return <Outlet />
}

export function AdminRoute() {
  const { session, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-tonight-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-tonight-accent border-t-transparent" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/discover" replace />

  return <Outlet />
}
