import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import usePageTitle from '../hooks/usePageTitle'
import { api } from '../lib/api'

export default function StudentDashboard() {
  usePageTitle('My Courses', 'Your enrolled courses at Codedefenze.security.')

  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    api
      .studentMe()
      .then((me) => {
        if (cancelled) return
        setName(me.name)
        return api.myCourses()
      })
      .then((data) => {
        if (cancelled || !data) return
        setCourses(data.courses || [])
      })
      .catch(() => {
        if (cancelled) return
        navigate('/student/login', { replace: true })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [navigate])

  async function handleLogout() {
    try {
      await api.studentLogout()
    } finally {
      navigate('/student/login')
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading your courses…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="container">
        <div
          className="page-banner page-banner-panel"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}
        >
          <div>
            <p className="eyebrow">My Courses</p>
            <h1>Welcome{name ? `, ${name}` : ''}</h1>
            <p>Course bundles your instructor has granted you access to.</p>
          </div>
          <button className="btn btn-outline" onClick={handleLogout}>
            Log Out
          </button>
        </div>

        {error && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
            Couldn't load your courses. Please try again shortly.
          </p>
        )}

        {!error && courses.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2.5rem' }}>
            You don't have access to any courses yet. Your instructor will grant access once your
            enrollment is confirmed.
          </p>
        )}

        {courses.length > 0 && (
          <div className="resource-grid" style={{ marginTop: '2rem' }}>
            {courses.map((c) => (
              <Link
                key={c.id}
                to={`/student/courses/${c.id}`}
                className="meta-card"
                style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
              >
                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)', marginBottom: '0.5rem' }}>
                  {c.title}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                  {c.description}
                </p>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {c.duration && <span>{c.duration}</span>}
                  {c.mode && <span>{c.mode}</span>}
                </div>
                <span className="btn btn-outline btn-sm" style={{ marginTop: '1rem', pointerEvents: 'none' }}>
                  Daily Classes →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
