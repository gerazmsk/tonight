import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { REPORT_REASONS } from '../lib/utils'
import type { ReportReason } from '../types'

interface ReportModalProps {
  userId: string
  userName: string
  onClose: () => void
  onBlocked?: () => void
}

export function ReportModal({ userId, userName, onClose, onBlocked }: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason>('harassment')
  const [details, setDetails] = useState('')
  const [alsoBlock, setAlsoBlock] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('reports').insert({
      reporter_id: user.id,
      reported_user_id: userId,
      reason,
      details: details || null,
    })

    if (alsoBlock) {
      await supabase.from('blocks').insert({
        blocker_id: user.id,
        blocked_id: userId,
      })
      onBlocked?.()
    }

    setDone(true)
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-tonight-card border border-tonight-border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Report {userName}</h2>
          <button onClick={onClose} className="text-tonight-muted hover:text-white">
            <X size={20} />
          </button>
        </div>

        {done ? (
          <div className="py-6 text-center">
            <p className="text-tonight-muted">Thank you. Our team will review this report.</p>
            <button onClick={onClose} className="mt-4 text-tonight-accent">Close</button>
          </div>
        ) : (
          <>
            <label className="mb-2 block text-sm text-tonight-muted">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="mb-4 w-full rounded-xl border border-tonight-border bg-tonight-bg px-3 py-2.5 text-sm"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>

            <label className="mb-2 block text-sm text-tonight-muted">Details (optional)</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className="mb-4 w-full rounded-xl border border-tonight-border bg-tonight-bg px-3 py-2.5 text-sm resize-none"
              placeholder="Tell us more..."
            />

            <label className="mb-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={alsoBlock}
                onChange={(e) => setAlsoBlock(e.target.checked)}
                className="accent-tonight-accent"
              />
              Also block this user
            </label>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-xl bg-red-600 py-3 text-sm font-medium hover:bg-red-500 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
