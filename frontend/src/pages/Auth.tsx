import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { usePageContext, useShop } from '../store'

/** After signing in, go back where the shopper came from (e.g. checkout). */
function useReturnTo() {
  const location = useLocation()
  return (location.state as { from?: string } | null)?.from || '/products'
}

export function Login() {
  usePageContext({ path: '/login', page_type: 'login' })
  const { signIn } = useShop()
  const navigate = useNavigate()
  const returnTo = useReturnTo()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const { user, token } = await api.login({ email, password })
      signIn(user, token)
      navigate(returnTo)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={submit}>
        <h1>Welcome back</h1>
        <p className="muted">Log in to check out faster and pick up your chat with Friendly Bulldog.</p>
        <label>
          Email
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        <p className="muted small center">
          New here? <Link to="/signup" state={{ from: returnTo }}>Create an account</Link>
        </p>
      </form>
    </div>
  )
}

export function Signup() {
  usePageContext({ path: '/signup', page_type: 'signup' })
  const { signIn } = useShop()
  const navigate = useNavigate()
  const returnTo = useReturnTo()
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', password: '', confirm_password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value })

  const mismatch = form.confirm_password.length > 0 && form.password !== form.confirm_password

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (mismatch) return setError('Passwords do not match.')
    setBusy(true)
    setError(null)
    try {
      const { user, token } = await api.signup(form)
      signIn(user, token, true)
      navigate(returnTo)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={submit}>
        <h1>Join the Bulldog family</h1>
        <p className="muted">One quick form and you're in. Your chats and checkout details are saved.</p>
        <div className="row">
          <label>
            First name
            <input autoComplete="given-name" required value={form.first_name} onChange={set('first_name')} />
          </label>
          <label>
            Last name
            <input autoComplete="family-name" required value={form.last_name} onChange={set('last_name')} />
          </label>
        </div>
        <label>
          Email
          <input type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
        </label>
        <label>
          Password <small className="muted">(8+ characters)</small>
          <input type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={set('password')} />
        </label>
        <label>
          Confirm password
          <input type="password" autoComplete="new-password" required value={form.confirm_password} onChange={set('confirm_password')} className={mismatch ? 'bad' : ''} />
        </label>
        {mismatch && <p className="error small">Passwords don't match yet.</p>}
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        <p className="muted small center">
          Already have an account? <Link to="/login" state={{ from: returnTo }}>Log in</Link>
        </p>
      </form>
    </div>
  )
}
