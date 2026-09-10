import { useEffect, useState } from 'react'
import CertificatePreview from '../components/CertificatePreview'
import { Link } from 'react-router-dom'
import usePageTitle from '../hooks/usePageTitle'
import { api } from '../lib/api'

export default function Certificate() {
  usePageTitle(
    'Certificate Preview',
    'Preview the completion certificate issued by Codedefenze.security.',
  )

  const [name, setName] = useState('Alex Johnson')
  const [courses, setCourses] = useState([])
  const [courseName, setCourseName] = useState('IT Infrastructure & Cyber Security Bundle')

  useEffect(() => {
    let cancelled = false
    api
      .courses()
      .then((data) => {
        if (cancelled) return
        const list = data.courses || []
        setCourses(list)
        if (list[0]) setCourseName(list[0].title)
      })
      .catch(() => {
        /* falls back to the default course name above */
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="page">
      <div className="container">
        <div className="page-banner page-banner-panel" style={{ textAlign: 'center' }}>
          <img
            src="/logo-icon.png"
            alt="Codedefenze logo"
            style={{ width: 440, height: 'auto', margin: '0 auto 1rem' }}
          />
          <p className="eyebrow">Official credential</p>
          <h1>Certificate Preview</h1>
          <p style={{ marginInline: 'auto' }}>
            Sample demo certificate issued by Codedefenze.security upon successful
            completion of your chosen course bundle.
          </p>
        </div>

        <div className="form-wrap form-card" style={{ margin: '2rem auto' }}>
          <div className="form-group">
            <label htmlFor="preview-name">Preview with a name</label>
            <input
              id="preview-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Student name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="preview-course">Course name</label>
            {courses.length > 0 ? (
              <select
                id="preview-course"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.title}>
                    {c.title}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="preview-course"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Course name"
              />
            )}
          </div>
        </div>

        <CertificatePreview studentName={name || 'Student Name'} courseName={courseName || 'Course Name'} />

        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Ready to earn yours? Enroll in the bundle today.
          </p>
          <Link to="/enroll" className="btn btn-primary">
            Enroll Now
          </Link>
        </div>
      </div>
    </div>
  )
}
