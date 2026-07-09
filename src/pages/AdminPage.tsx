import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface AdminStats {
  total_users: number
  new_users_today: number
  active_tonight_sessions: number
  total_matches: number
  open_reports: number
  male_users: number
  female_users: number
  completed_profiles: number
}

export function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<Profile[]>([])
  const [reports, setReports] = useState<Array<{
    id: string
    reason: string
    status: string
    created_at: string
    reporter: { full_name: string | null }
    reported: { full_name: string | null }
  }>>([])
  const [sessions, setSessions] = useState<Array<{
    id: string
    intent: string
    expires_at: string
    profile: { full_name: string | null }
    venue: { name: string }
  }>>([])

  useEffect(() => {
    const load = async () => {
      const { data: statsData } = await supabase.rpc('get_admin_stats')
      setStats(statsData as unknown as AdminStats)

      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      setUsers((userData as Profile[]) ?? [])

      const { data: reportData } = await supabase
        .from('reports')
        .select('*, reporter:profiles!reports_reporter_id_fkey(full_name), reported:profiles!reports_reported_user_id_fkey(full_name)')
        .order('created_at', { ascending: false })
        .limit(20)
      setReports(reportData ?? [])

      const { data: sessionData } = await supabase
        .from('tonight_sessions')
        .select('*, profile:profiles(full_name), venue:venues(name)')
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('starts_at', { ascending: false })
      setSessions(sessionData ?? [])
    }

    load()
  }, [])

  const suspendUser = async (userId: string, suspend: boolean) => {
    await supabase.from('profiles').update({ is_suspended: suspend }).eq('id', userId)
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_suspended: suspend } : u)))
  }

  const statCards = stats
    ? [
        { label: 'Total users', value: stats.total_users },
        { label: 'New today', value: stats.new_users_today },
        { label: 'Active Tonight', value: stats.active_tonight_sessions },
        { label: 'Matches', value: stats.total_matches },
        { label: 'Open reports', value: stats.open_reports },
        { label: 'Male users', value: stats.male_users },
        { label: 'Female users', value: stats.female_users },
        { label: 'Completed profiles', value: stats.completed_profiles },
      ]
    : []

  return (
    <div className="min-h-screen bg-tonight-bg px-4 py-5 pb-12">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/profile" className="text-tonight-muted hover:text-white">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-tonight-border bg-tonight-card p-4">
            <p className="text-2xl font-bold text-tonight-accent">{s.value}</p>
            <p className="text-xs text-tonight-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold">Active Tonight Sessions</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-tonight-muted">None active</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="rounded-xl border border-tonight-border bg-tonight-card p-3 text-sm">
                <p className="font-medium">{s.profile?.full_name} @ {s.venue?.name}</p>
                <p className="text-tonight-muted capitalize">{s.intent.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold">Reports</h2>
        {reports.map((r) => (
          <div key={r.id} className="mb-2 rounded-xl border border-tonight-border bg-tonight-card p-3 text-sm">
            <p>{r.reporter?.full_name} reported {r.reported?.full_name}</p>
            <p className="text-tonight-muted capitalize">{r.reason.replace('_', ' ')} — {r.status}</p>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold">Users</h2>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-xl border border-tonight-border bg-tonight-card p-3">
              <div>
                <p className="font-medium">{u.full_name ?? u.email}</p>
                <p className="text-xs text-tonight-muted capitalize">{u.gender} · {u.city}</p>
              </div>
              <button
                onClick={() => suspendUser(u.id, !u.is_suspended)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  u.is_suspended ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                }`}
              >
                {u.is_suspended ? 'Unsuspend' : 'Suspend'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
