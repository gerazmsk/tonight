import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Moon } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function SignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    navigate('/onboarding')
  }

  return (
    <div className="flex min-h-screen flex-col bg-tonight-bg px-5 py-8">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 flex items-center gap-2 text-xl font-semibold">
          <Moon className="text-tonight-accent" size={24} />
          Tonight
        </div>

        <h1 className="text-2xl font-bold">Join Tonight</h1>
        <p className="mt-2 text-tonight-muted">Create your account to get started</p>

        <form onSubmit={handleSignup} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-tonight-muted">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-tonight-border bg-tonight-card px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-tonight-muted">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-tonight-border bg-tonight-card px-4 py-3 text-sm"
            />
          </div>

          <p className="text-xs text-tonight-muted">You must be 18+ to use Tonight.</p>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-tonight-accent py-3.5 font-semibold hover:bg-tonight-accent-hover disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-tonight-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-tonight-accent hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  )
}
