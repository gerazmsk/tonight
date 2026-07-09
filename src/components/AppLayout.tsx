import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  return (
    <div className="page-with-nav min-h-screen bg-tonight-bg">
      <Outlet />
      <BottomNav />
    </div>
  )
}
