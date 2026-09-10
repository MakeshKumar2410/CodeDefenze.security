import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import usePageTitle from '../hooks/usePageTitle'
import { api } from '../lib/api'

export default function CourseDetail() {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  usePageTitle(
    course?.title || 'Course Details',
    course?.description || 'Course details at Codedefenze.security.',
  )

  useEffect(() => {
    let cancelled = false
    api
      .courses()
      .then((data) => {
        if (cancelled) return
        const found = (data.courses || []).find((c) => c.id === id)
        setCourse(found || null)
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
  }, [id])

  if (loading) {
    return (
      <div className="page">
        <div className="container">
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading course details…</p>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="page">
        <div className="container">
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            That course couldn't be found.{' '}
            <Link to="/course" style={{ color: 'var(--sky-600)' }}>
              See all courses
            </Link>
          </p>
        </div>
      </div>
    )
  }

  const syllabus = course.syllabus || []
  const learnings = course.learnings || []

  return (
    <div className="page">
      <div className="container">
        <Link to="/course" style={{ color: 'var(--sky-600)', fontSize: '0.9rem' }}>
          ← All Courses
        </Link>

        <div className="page-banner page-banner-panel" style={{ marginTop: '1rem' }}>
          <p className="eyebrow">Flagship program</p>
          <h1>{course.title}</h1>
          <p>{course.description}</p>
        </div>

        <div className="course-meta">
          <div className="meta-item meta-card">
            <label>Duration</label>
            <strong>{course.duration}</strong>
          </div>
          <div className="meta-item meta-card">
            <label>Fees</label>
            <strong>{course.fee}</strong>
          </div>
          <div className="meta-item meta-card">
            <label>Mode</label>
            <strong>{course.mode}</strong>
          </div>
        </div>

        {syllabus.length > 0 && (
          <>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                marginBottom: '1rem',
                color: 'var(--navy)',
              }}
            >
              Course Syllabus
            </h2>
            <div className="syllabus-list">
              {syllabus.map((s, i) => (
                <div key={`${s.mod}-${i}`} className="syllabus-item syllabus-card">
                  <span className="syllabus-mod">{s.mod}</span>
                  <div>
                    <h4>{s.title}</h4>
                    <p>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {learnings.length > 0 && (
          <>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                marginBottom: '1rem',
                color: 'var(--navy)',
              }}
            >
              What Students Will Learn
            </h2>
            <ul className="learn-list" style={{ marginBottom: '3rem' }}>
              {learnings.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </>
        )}

        <div className="section-head" style={{ textAlign: 'left', margin: '0 0 1.5rem' }}>
          <h2>Meet the Team</h2>
          <p>Your mentors throughout the program.</p>
        </div>

        <div className="team-grid" style={{ marginBottom: '2.5rem' }}>
          <article className="team-member team-card">
            <div className="team-avatar">M</div>
            <div>
              <h3>Makeshkumar</h3>
              <p className="team-role">Founder & Lead Technical Trainer</p>
              <p>
                Leads all technical modules, lab sessions, and assessments.
                Focused on turning concepts into practical, job-ready capability.
              </p>
            </div>
          </article>
          <article className="team-member team-card">
            <div className="team-avatar">J</div>
            <div>
              <h3>Jagan</h3>
              <p className="team-role">Business Development Manager</p>
              <p>
                Guides enrollments, student onboarding, and institutional
                partnerships so every learner gets the right support path.
              </p>
            </div>
          </article>
        </div>

        <Link to="/enroll" className="btn btn-primary">
          Enroll in This Bundle
        </Link>
      </div>
    </div>
  )
}
