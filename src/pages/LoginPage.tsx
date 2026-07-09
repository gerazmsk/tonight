import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Moon } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    navigate('/discover')
  }

  return (
    <div className="flex min-h-screen flex-col bg-tonight-bg px-5 py-8">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 flex items-center gap-2 text-xl font-semibold">
          <Moon className="text-tonight-accent" size={24} />
          Tonight
        </div>

        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-2 text-tonight-muted">Log in to continue</p>

        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-tonight-muted">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-tonight-border bg-tonight-card px-4 py-3 text-sm"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-tonight-muted">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-tonight-border bg-tonight-card px-4 py-3 text-sm"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-tonight-accent py-3.5 font-semibold hover:bg-tonight-accent-hover disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-tonight-muted">
          New here?{' '}
          <Link to="/signup" className="text-tonight-accent hover:underline">Create account</Link>
        </p>
      </div>
    </div>
  )
}
