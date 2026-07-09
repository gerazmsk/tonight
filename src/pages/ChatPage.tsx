import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/Button'

interface Message {
  id: string
  sender_id: string
  message_text: string
  created_at: string
  read_at: string | null
}

function formatMessageTime(date: string): string {
  const d = new Date(date)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function ChatPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [otherName, setOtherName] = useState('')
  const [otherPhoto, setOtherPhoto] = useState<string | null>(null)
  const [otherUserId, setOtherUserId] = useState<string | null>(null)
  const [tonightPrompt, setTonightPrompt] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!matchId || !user) return

    const load = async () => {
      const { data: match } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .is('unmatched_at', null)
        .single()

      if (!match) {
        navigate('/connections?tab=matches')
        return
      }

      const otherId = match.user_one_id === user.id ? match.user_two_id : match.user_one_id
      setOtherUserId(otherId)

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', otherId)
        .single()

      const { data: photo } = await supabase
        .from('profile_photos')
        .select('photo_url')
        .eq('user_id', otherId)
        .eq('is_primary', true)
        .limit(1)
        .maybeSingle()

      setOtherName(profile?.full_name ?? 'Match')
      setOtherPhoto(photo?.photo_url ?? null)

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
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const msg = payload.new as Message
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          if (msg.sender_id !== user.id) {
            supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', msg.id)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [matchId, user, navigate])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !user || !matchId || sending) return

    setSending(true)
    const messageText = text.trim()
    setText('')

    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: user.id,
        message_text: messageText,
      })
      .select()
      .single()

    if (!error && data) {
      setMessages((prev) => [...prev, data as Message])
    } else {
      setText(messageText)
    }
    setSending(false)
  }

  return (
    <div className="flex h-dvh flex-col bg-tonight-bg">
      <header className="flex items-center gap-3 border-b border-tonight-border px-4 py-3 shrink-0">
        <button
          onClick={() => navigate('/connections?tab=matches')}
          className="text-tonight-muted hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={() => otherUserId && navigate(`/user/${otherUserId}`)}
          className="flex items-center gap-3 min-w-0 flex-1 text-left"
        >
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-tonight-border">
            {otherPhoto && <img src={otherPhoto} alt="" className="h-full w-full object-cover" />}
          </div>
          <h1 className="font-semibold truncate">{otherName}</h1>
        </button>
      </header>

      {tonightPrompt && (
        <div className="mx-4 mt-3 shrink-0 rounded-xl border border-tonight-accent/30 bg-tonight-accent/10 px-4 py-3 text-sm text-center">
          You are both out tonight. Want to say hi?
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-tonight-muted py-8">
            Say hello to {otherName}!
          </p>
        )}
        {messages.map((m) => {
          const isMine = m.sender_id === user?.id
          return (
            <div key={m.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  isMine
                    ? 'bg-tonight-accent text-white rounded-br-md'
                    : 'bg-tonight-card border border-tonight-border rounded-bl-md'
                }`}
              >
                {m.message_text}
              </div>
              <span className="mt-1 text-[10px] text-tonight-muted px-1">
                {formatMessageTime(m.created_at)}
              </span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={sendMessage}
        className="flex gap-2 border-t border-tonight-border p-4 shrink-0"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="field-input flex-1 !min-h-[44px]"
        />
        <Button
          type="submit"
          disabled={!text.trim() || sending}
          className="!min-h-[44px] !min-w-[44px] !px-3"
        >
          <Send size={18} />
        </Button>
      </form>
    </div>
  )
}
