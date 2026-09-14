import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import usePageTitle from '../hooks/usePageTitle'
import { api } from '../lib/api'

export default function StudentCourseClasses() {
  const { courseId } = useParams()
  const navigate = useNavigate()

  const [classes, setClasses] = useState([])
  const [playingId, setPlayingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  usePageTitle('Daily Classes', 'Watch your recorded classes at Codedefenze.security.')

  useEffect(() => {
    let cancelled = false

    api
      .studentMe()
      .catch(() => {
        if (!cancelled) navigate('/student/login', { replace: true })
        throw new Error('redirecting')
      })
      .then(() => api.courseClasses(courseId))
      .then((data) => {
        if (cancelled) return
        setClasses(data.classes || [])
      })
      .catch((err) => {
        if (cancelled || err.message === 'redirecting') return
        setError(err.message || "You don't have access to this course.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [courseId, navigate])

  function formatDate(iso) {
    if (!iso) return null
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }

  return (
    <div className="page">
      <div className="container">
        <Link to="/student/dashboard" style={{ color: 'var(--sky-600)', fontSize: '0.9rem' }}>
          ← My Courses
        </Link>

        <div className="page-banner page-banner-panel" style={{ marginTop: '1rem' }}>
          <p className="eyebrow">Recorded classes</p>
          <h1>Daily Classes</h1>
          <p>Pick a day below to watch that class.</p>
        </div>

        {loading && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>Loading classes…</p>
        )}

        {!loading && error && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>{error}</p>
        )}

        {!loading && !error && classes.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
            No classes have been uploaded for this course yet. Check back soon.
          </p>
        )}

        {!loading && !error && classes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem', marginBottom: '3rem' }}>
            {classes.map((cl) => (
              <div key={cl.id} className="syllabus-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <span className="syllabus-mod">Day {String(cl.dayNumber).padStart(2, '0')}</span>
                    <h4 style={{ margin: '0.35rem 0 0' }}>{cl.title}</h4>
                    {cl.uploadedAt && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
                        Date: {formatDate(cl.uploadedAt)}
                      </p>
                    )}
                  </div>

                  {cl.hasVideo ? (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setPlayingId((id) => (id === cl.id ? null : cl.id))}
                    >
                      {playingId === cl.id ? 'Hide Video' : '▶ Watch Video'}
                    </button>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Video coming soon</span>
                  )}
                </div>

                {playingId === cl.id && cl.hasVideo && (
                  <video
                    controls
                    autoPlay
                    style={{ width: '100%', marginTop: '1rem', borderRadius: 8, background: '#000', maxHeight: 480 }}
                    src={cl.videoUrl}
                  >
                    Your browser doesn't support embedded video.
                  </video>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
