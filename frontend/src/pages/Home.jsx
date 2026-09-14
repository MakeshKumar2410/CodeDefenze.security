import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Terminal from '../components/Terminal'
import Testimonials from '../components/Testimonials'
import CertificatePreview from '../components/CertificatePreview'
import Brand from '../components/Brand'
import usePageTitle from '../hooks/usePageTitle'
import { api } from '../lib/api'

export default function Home() {
  usePageTitle(
    undefined,
    'Professional IT Infrastructure & Cybersecurity training institute. Build secure systems, defend modern infrastructure.',
  )

  const [content, setContent] = useState(null)

  useEffect(() => {
    let cancelled = false
    api
      .home()
      .then((data) => {
        if (!cancelled) setContent(data)
      })
      .catch(() => {
        /* Sections below all handle a null/missing content gracefully */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const hero = content?.hero
  const highlights = content?.highlights || []
  const whyUs = content?.whyUs || []
  const faqs = content?.faqs || []
  const cert = content?.certificatePreview

  return (
    <>
      <section className="hero hero-solo">
        <div className="hero-glow" aria-hidden="true" />
        <div className="container hero-solo-inner">
          <p className="eyebrow">{hero?.eyebrow || 'IT + Cybersecurity Training Institute'}</p>
          <h1 className="hero-brand">
            <Brand />
          </h1>
          <p className="hero-headline">
            {hero?.headline || 'Build secure systems. Defend modern infrastructure.'}
          </p>
          <p className="hero-sub hero-sub-center">
            {hero?.subtext ||
              'A professional training institute for students and aspiring professionals ready to master IT infrastructure and cybersecurity.'}
          </p>
          <div className="hero-actions hero-actions-center">
            <Link to={hero?.ctaLink || '/enroll'} className="btn btn-primary">
              {hero?.ctaText || 'Enroll Now'}
            </Link>
            <Link to={hero?.secondaryCtaLink || '/course'} className="btn btn-outline">
              {hero?.secondaryCtaText || 'View Course'}
            </Link>
            <a href="#platform" className="btn btn-ghost">
              See Platform ↓
            </a>
          </div>
        </div>
      </section>

      <section id="platform" className="section terminal-section">
        <div className="container">
          <div className="section-head">
            <h2>Live Platform Preview</h2>
            <p>
              A cyber-security style terminal that shows how Codedefenze.security
              positions itself as a hands-on training platform.
            </p>
          </div>
          <div className="terminal-wrap">
            <Terminal />
          </div>
        </div>
      </section>

      <section className="section stats-section">
        <div className="container">
          <div className="stats-grid">
            {(hero?.stats || []).map((s) => (
              <div key={s.label} className="stat-card">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Course Highlights</h2>
            <p>
              Everything you need to start a career at the intersection of IT
              operations and cyber defense.
            </p>
          </div>
          <div className="highlight-grid">
            {highlights.map((h) => (
              <article key={h.id} className="feature-card">
                <div className={`feature-icon icon-${h.icon}`} aria-hidden="true" />
                <h3>{h.title}</h3>
                <p>{h.text}</p>
                <Link to={h.buttonLink || '/course'} className="feature-link">
                  {h.buttonText || 'Explore syllabus →'}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <h2>Why Choose Us</h2>
            <p>
              Practical training, clear mentoring, and a pathway from classroom
              concepts to job-ready skills.
            </p>
          </div>
          <div className="why-grid">
            {whyUs.map((w, i) => (
              <article key={w.id} className="why-card">
                <span className="why-num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section cta-band">
        <div className="container cta-band-inner">
          <div>
            <h2>Ready to start your cybersecurity journey?</h2>
            <p>Join the IT Infrastructure & Cyber Security Bundle today.</p>
          </div>
          <div className="cta-band-actions">
            <Link to="/enroll" className="btn btn-primary">
              Enroll Now
            </Link>
            <Link to="/resources" className="btn btn-ghost">
              Free Demo Class
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Student Testimonials</h2>
            <p>Hear from learners — submit your review and it appears live on the site.</p>
          </div>
          <Testimonials />
        </div>
      </section>

      {cert?.enabled !== false && (
        <section className="section section-alt">
          <div className="container">
            <div className="section-head">
              <h2>{cert?.heading || 'Certificate Preview'}</h2>
              <p>{cert?.description || 'Sample certificate awarded on successful course completion.'}</p>
            </div>
            <div className="cert-frame">
              <CertificatePreview />
            </div>
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link to={cert?.buttonLink || '/certificate'} className="btn btn-outline">
                {cert?.buttonText || 'View Full Certificate Page'}
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Frequently Asked Questions</h2>
            <p>Quick answers before you enroll or book a demo.</p>
          </div>
          <div className="faq-list">
            {faqs.map((f) => (
              <details key={f.id} className="faq-item">
                <summary>{f.question}</summary>
                <p>{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
