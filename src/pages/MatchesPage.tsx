import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatRelativeTime } from '../lib/utils'
import type { MatchWithProfile } from '../types'

export function MatchesPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<MatchWithProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const load = async () => {
      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .or(`user_one_id.eq.${user.id},user_two_id.eq.${user.id}`)
        .is('unmatched_at', null)
        .order('created_at', { ascending: false })

      if (!matchData) {
        setLoading(false)
        return
      }

      const enriched: MatchWithProfile[] = []

      for (const m of matchData) {
        const otherId = m.user_one_id === user.id ? m.user_two_id : m.user_one_id

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', otherId)
          .single()

        const { data: photo } = await supabase
          .from('profile_photos')
          .select('photo_url')
          .eq('user_id', otherId)
          .eq('is_primary', true)
          .limit(1)
          .maybeSingle()

        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .eq('match_id', m.id)
          .order('created_at', { ascending: false })
          .limit(1)

        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('match_id', m.id)
          .neq('sender_id', user.id)
          .is('read_at', null)

        enriched.push({
          id: m.id,
          created_at: m.created_at,
          other_user: {
            id: otherId,
            full_name: profile?.full_name ?? null,
            primary_photo: photo?.photo_url ?? null,
          },
          last_message: messages?.[0] ?? null,
          unread_count: count ?? 0,
        })
      }

      setMatches(enriched)
      setLoading(false)
    }

    load()

    const channel = supabase
      .channel('matches-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, load)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user])

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-tonight-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="px-4 py-5">
      <h1 className="mb-4 text-xl font-semibold">Matches</h1>

      {matches.length === 0 ? (
        <p className="text-tonight-muted">No matches yet. Keep discovering!</p>
      ) : (
        <div className="space-y-2">
          {matches.map((m) => (
            <Link
              key={m.id}
              to={`/chat/${m.id}`}
              className="flex items-center gap-3 rounded-xl border border-tonight-border bg-tonight-card p-3 hover:border-tonight-accent/50 transition-colors"
            >
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-tonight-border">
                {m.other_user.primary_photo ? (
                  <img src={m.other_user.primary_photo} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{m.other_user.full_name}</p>
                  {m.last_message && (
                    <span className="text-xs text-tonight-muted">
                      {formatRelativeTime(m.last_message.created_at)}
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-tonight-muted">
                  {m.last_message?.message_text ?? 'Say hello!'}
                </p>
              </div>
              {m.unread_count > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-tonight-accent text-xs font-bold">
                  {m.unread_count}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
