export default function CertificatePreview({
  studentName = 'Alex Johnson',
  courseName = 'IT Infrastructure & Cyber Security Bundle',
  date = '15 March 2026',
  certId = 'CDZ-2026-DEMO-0042',
}) {
  return (
    <div className="cert-shell" aria-label="Sample certificate preview">
      <article className="cert-preview">
        <div className="cert-border" aria-hidden="true" />

        <div className="cert-watermark" aria-hidden="true" />

        <header className="cert-top">
          <div className="cert-org">
            <div>
              <p className="cert-org-name">codedefenze.security</p>
              <p className="cert-org-tag">Professional IT & Cybersecurity Training</p>
            </div>
          </div>
          <div className="cert-badge" aria-hidden="true">
            <span>DEMO</span>
          </div>
        </header>

        <p className="cert-kicker">This is to certify that</p>
        <h2 className="cert-headline">Certificate of Completion</h2>

        <p className="cert-name">{studentName}</p>

        <p className="cert-body">
          has successfully completed the professional training program
        </p>
        <p className="cert-course">{courseName}</p>
        <p className="cert-desc">
          demonstrating proficiency in IT infrastructure, network security, and
          cybersecurity fundamentals under the guidance of Codedefenze.security.
        </p>

        <div className="cert-meta-inline">
          <div className="cert-meta">
            <span>Date of Issue</span>
            <strong>{date}</strong>
          </div>
          <div className="cert-meta">
            <span>Certificate ID</span>
            <strong>{certId}</strong>
          </div>
        </div>

        <footer className="cert-footer">
          <div className="cert-sign">
            <p className="cert-sign-label">Founder Signature</p>
            <div className="cert-sign-pad" aria-label="Area for founder signature" />
            <div className="cert-sign-line" />
            <p className="cert-sign-name">Makeshkumar</p>
            <p className="cert-sign-role">Founder & Lead Technical Trainer</p>
          </div>

          <div className="cert-brand-mark" aria-label="Codedefenze logo mark">
            <img src="/logo-icon.png" alt="Codedefenze logo" />
          </div>
        </footer>
      </article>
    </div>
  )
}
