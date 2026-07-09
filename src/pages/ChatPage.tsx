import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Message {
  id: string
  sender_id: string
  message_text: string
  created_at: string
  read_at: string | null
}

export function ChatPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [otherName, setOtherName] = useState('')
  const [tonightPrompt, setTonightPrompt] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!matchId || !user) return

    const load = async () => {
      const { data: match } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (!match) return

      const otherId = match.user_one_id === user.id ? match.user_two_id : match.user_one_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', otherId)
        .single()

      setOtherName(profile?.full_name ?? 'Match')

      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })

      setMessages(msgs ?? [])

      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('match_id', matchId)
        .neq('sender_id', user.id)
        .is('read_at', null)

      const { data: mySession } = await supabase
        .from('tonight_sessions')
        .select('venue_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .limit(1)
        .maybeSingle()

      const { data: theirSession } = await supabase
        .from('tonight_sessions')
        .select('venue_id')
        .eq('user_id', otherId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .limit(1)
        .maybeSingle()

      if (mySession && theirSession && mySession.venue_id === theirSession.venue_id) {
        setTonightPrompt(true)
      }
    }

    load()

    const channel = supabase
      .channel(`chat-${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [matchId, user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !user || !matchId) return

    const { error } = await supabase.from('messages').insert({
      match_id: matchId,
      sender_id: user.id,
      message_text: text.trim(),
    })

    if (!error) setText('')
  }

  return (
    <div className="flex h-screen flex-col bg-tonight-bg">
      <header className="flex items-center gap-3 border-b border-tonight-border px-4 py-3">
        <button onClick={() => navigate('/matches')} className="text-tonight-muted hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-semibold">{otherName}</h1>
      </header>

      {tonightPrompt && (
        <div className="mx-4 mt-3 rounded-xl border border-tonight-accent/30 bg-tonight-accent/10 px-4 py-3 text-sm text-center">
          You are both out tonight. Want to say hi?
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m) => {
          const isMine = m.sender_id === user?.id
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  isMine
                    ? 'bg-tonight-accent text-white rounded-br-md'
                    : 'bg-tonight-card border border-tonight-border rounded-bl-md'
                }`}
              >
                {m.message_text}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2 border-t border-tonight-border p-4 safe-bottom">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-xl border border-tonight-border bg-tonight-card px-4 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-tonight-accent disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
