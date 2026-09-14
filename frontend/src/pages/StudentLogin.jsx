import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import usePageTitle from '../hooks/usePageTitle'
import { api } from '../lib/api'

export default function StudentLogin() {
  usePageTitle('Student Login', 'Log in to access your enrolled course videos at Codedefenze.security.')

  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  // Already logged in? Skip straight to the dashboard.
  useEffect(() => {
    let cancelled = false
    api
      .studentMe()
      .then(() => {
        if (!cancelled) navigate('/student/dashboard', { replace: true })
      })
      .catch(() => {
        if (!cancelled) setChecking(false)
      })
    return () => {
      cancelled = true
    }
  }, [navigate])

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.studentLogin(form.email, form.password)
      navigate('/student/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) return null

  return (
    <div className="page">
      <div className="container">
        <div className="page-banner page-banner-panel">
          <p className="eyebrow">Enrolled students</p>
          <h1>Student Login</h1>
          <p>Log in with the email and password your instructor set up for you to watch your course videos.</p>
        </div>

        <div className="form-wrap">
          <form onSubmit={handleSubmit}>
            {error && (
              <p
                style={{
                  background: '#fdeceb',
                  border: '1px solid #f3b9b3',
                  color: '#b3261e',
                  padding: '0.85rem 1rem',
                  borderRadius: 8,
                  marginBottom: '1.15rem',
                  fontSize: '0.9rem',
                }}
              >
                {error}
              </p>
            )}

            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required autoComplete="email" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Don't have a login yet? Your access is set up by your instructor after you{' '}
            <Link to="/enroll" style={{ color: 'var(--sky-600)' }}>
              enroll
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
