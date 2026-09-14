import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import usePageTitle from '../hooks/usePageTitle'
import { api } from '../lib/api'

export default function Course() {
  usePageTitle(
    'Our Courses',
    'Explore training bundles at Codedefenze.security — IT infrastructure, networking, and cybersecurity.',
  )

  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .courses()
      .then((data) => {
        if (cancelled) return
        setCourses(data.courses || [])
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="page">
      <div className="container">
        <div className="page-banner page-banner-panel">
          <p className="eyebrow">Our programs</p>
          <h1>Courses</h1>
          <p>Pick a bundle to see the full syllabus, fees, and what you'll learn.</p>
        </div>

        {loading && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
            Loading courses…
          </p>
        )}

        {error && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
            Courses are unavailable right now. Please check back soon.
          </p>
        )}

        {!loading && !error && courses.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
            No courses published yet.
          </p>
        )}

        {!loading && !error && courses.length > 0 && (
          <div className="course-card-grid" style={{ marginTop: '2rem' }}>
            {courses.map((c) => (
              <Link
                key={c.id}
                to={`/course/${c.id}`}
                className="info-card"
                style={{ display: 'block', textDecoration: 'none', marginBottom: '1.25rem' }}
              >
                <h3 style={{ color: 'var(--navy)' }}>{c.title}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{c.description}</p>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--sky-600)', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {c.duration && <span>{c.duration}</span>}
                  {c.fee && <span>{c.fee}</span>}
                  {c.mode && <span>{c.mode}</span>}
                </div>
                <span className="btn btn-outline btn-sm" style={{ marginTop: '1rem', display: 'inline-flex' }}>
                  View Details →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
