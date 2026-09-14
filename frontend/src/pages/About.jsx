import { useEffect, useState } from 'react'
import usePageTitle from '../hooks/usePageTitle'
import { api } from '../lib/api'

export default function About() {
  usePageTitle(
    'About Us',
    'We train the next generation of IT and cybersecurity professionals with practical skills, real labs, and career-focused mentoring.',
  )

  const [content, setContent] = useState(null)

  useEffect(() => {
    let cancelled = false
    api
      .about()
      .then((data) => {
        if (!cancelled) setContent(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const intro = content?.intro
  const sections = content?.sections || []
  const trainers = content?.trainers || []

  return (
    <div className="page">
      <div className="container">
        <div className="page-banner page-banner-panel">
          <img
            src="/logo-icon.png"
            alt="Codedefenze.security — Code. Defend. Secure."
            style={{ width: 'min(180px, 60%)', margin: '0 auto 1.5rem', display: 'block' }}
          />
          <p className="eyebrow">Who we are</p>
          <h1>{intro?.heading || 'About Codedefenze.security'}</h1>
          <p>
            {intro?.description ||
              'We train the next generation of IT and cybersecurity professionals with practical skills, real labs, and career-focused mentoring.'}
          </p>
        </div>

        <div className="mission-grid" style={{ marginTop: '2.5rem' }}>
          <div className="mission-block info-card">
            <h3>{intro?.missionTitle || 'Our Mission'}</h3>
            <p>
              {intro?.missionText ||
                'To make high-quality IT infrastructure and cybersecurity education accessible, practical, and industry-relevant — empowering students to build, secure, and defend modern digital systems with confidence.'}
            </p>
          </div>
          <div className="mission-block info-card">
            <h3>{intro?.visionTitle || 'Our Vision'}</h3>
            <p>
              {intro?.visionText ||
                'To become a trusted training institute known for producing job-ready talent who strengthen organizational security posture and drive safer technology adoption across industries.'}
            </p>
          </div>
        </div>

        <div className="section-head" style={{ textAlign: 'left', margin: '2.5rem 0 1.5rem' }}>
          <h2>Leadership</h2>
          <p>Meet the people building Codedefenze.security.</p>
        </div>

        <div className="team-grid">
          <article className="team-member team-card">
            <div className="team-avatar" aria-hidden="true">
              M
            </div>
            <div>
              <h3>Makeshkumar</h3>
              <p className="team-role">Founder & Lead Technical Trainer</p>
              <p>
                Makeshkumar founded Codedefenze.security with a clear goal: teach
                cybersecurity the way the industry practices it. As Lead Technical
                Trainer, he designs the curriculum, leads labs on infrastructure
                and defense, and mentors students from fundamentals to advanced
                security concepts.
              </p>
            </div>
          </article>

          <article className="team-member team-card">
            <div className="team-avatar" aria-hidden="true">
              J
            </div>
            <div>
              <h3>Jagan</h3>
              <p className="team-role">Business Development Manager</p>
              <p>
                Jagan leads outreach, partnerships, and student enrollment
                growth. He connects colleges and aspiring professionals with the
                right learning path, ensures a smooth onboarding experience, and
                builds relationships that help Codedefenze.security scale its
                impact.
              </p>
            </div>
          </article>
        </div>

        {trainers.length > 0 && (
          <>
            <div className="section-head" style={{ textAlign: 'left', margin: '2.5rem 0 1.5rem' }}>
              <h2>Our Trainers</h2>
              <p>The instructors behind every module and lab session.</p>
            </div>
            <div className="team-grid">
              {trainers.map((t) => (
                <article key={t.id} className="team-member team-card">
                  {t.photo ? (
                    <img
                      src={t.photo}
                      alt={t.name}
                      className="team-avatar"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="team-avatar" aria-hidden="true">
                      {t.name?.[0] || 'T'}
                    </div>
                  )}
                  <div>
                    <h3>{t.name}</h3>
                    <p className="team-role">{t.designation || t.title}</p>
                    {t.bio && <p>{t.bio}</p>}
                    {t.skills?.length > 0 && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <strong>Skills: </strong>
                        {t.skills.join(' | ')}
                      </p>
                    )}
                    {t.experience && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <strong>Experience: </strong>
                        {t.experience}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                      {t.linkedin && (
                        <a href={t.linkedin} target="_blank" rel="noreferrer" style={{ color: 'var(--sky-600)', fontSize: '0.85rem' }}>
                          LinkedIn
                        </a>
                      )}
                      {t.github && (
                        <a href={t.github} target="_blank" rel="noreferrer" style={{ color: 'var(--sky-600)', fontSize: '0.85rem' }}>
                          GitHub
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {sections.map((s) => (
          <div key={s.id} style={{ marginTop: '2.5rem' }}>
            <div className="section-head" style={{ textAlign: 'left', margin: '0 0 1.5rem' }}>
              <h2>{s.title}</h2>
              {s.subtitle && <p>{s.subtitle}</p>}
            </div>
            <div className="mission-block info-card">
              {s.image && (
                <img src={s.image} alt={s.title} style={{ maxWidth: '100%', borderRadius: '10px', marginBottom: '1rem' }} />
              )}
              <p>{s.description}</p>
              {s.buttonText && s.buttonLink && (
                <a href={s.buttonLink} className="btn btn-outline" style={{ marginTop: '1rem', display: 'inline-flex' }}>
                  {s.buttonText}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
