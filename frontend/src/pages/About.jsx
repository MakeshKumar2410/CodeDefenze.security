import usePageTitle from '../hooks/usePageTitle'

export default function About() {
  usePageTitle(
    'About Us',
    'We train the next generation of IT and cybersecurity professionals with practical skills, real labs, and career-focused mentoring.',
  )

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
          <h1>About Codedefenze.security</h1>
          <p>
            We train the next generation of IT and cybersecurity professionals
            with practical skills, real labs, and career-focused mentoring.
          </p>
        </div>

        <div className="mission-grid" style={{ marginTop: '2.5rem' }}>
          <div className="mission-block info-card">
            <h3>Our Mission</h3>
            <p>
              To make high-quality IT infrastructure and cybersecurity education
              accessible, practical, and industry-relevant — empowering students
              to build, secure, and defend modern digital systems with confidence.
            </p>
          </div>
          <div className="mission-block info-card">
            <h3>Our Vision</h3>
            <p>
              To become a trusted training institute known for producing
              job-ready talent who strengthen organizational security posture
              and drive safer technology adoption across industries.
            </p>
          </div>
        </div>

        <div className="section-head" style={{ textAlign: 'left', margin: '0 0 1.5rem' }}>
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
      </div>
    </div>
  )
}
