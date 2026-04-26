import { useState } from 'react'
import { supabase, hasCredentials } from '../supabaseClient'

export default function Auth() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setErr(null)
    setMsg(null)
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMsg('Account created. Check your email to confirm, then sign in.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (e2) {
      setErr(e2.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="card w-full max-w-md p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Expense Tracker</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
        </p>

        {!hasCredentials && (
          <div className="mt-4 text-sm border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg p-3">
            Supabase credentials aren't set. Copy <code>.env.example</code> to <code>.env.local</code> and fill
            in your project's URL and anon key.
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-3">
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {err && <div className="text-sm text-red-500">{err}</div>}
          {msg && <div className="text-sm text-emerald-600 dark:text-emerald-400">{msg}</div>}
          <button className="btn btn-primary w-full" disabled={loading || !hasCredentials}>
            {loading ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          {mode === 'signin' ? (
            <>
              No account?{' '}
              <button className="text-brand hover:underline" onClick={() => setMode('signup')}>
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button className="text-brand hover:underline" onClick={() => setMode('signin')}>
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
