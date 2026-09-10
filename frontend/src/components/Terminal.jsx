import { useEffect, useState } from 'react'

const lines = [
  { delay: 0, html: '<span class="term-prompt">root@codedefenze:~$</span> <span class="term-cmd">./init_platform.sh</span>' },
  { delay: 400, html: '<span class="term-ok">✓</span> <span class="term-info">Loading cybersecurity training modules...</span>' },
  { delay: 800, html: '<span class="term-ok">✓</span> <span class="term-info">IT Infrastructure stack online</span>' },
  { delay: 1200, html: '<span class="term-ok">✓</span> <span class="term-info">Threat detection labs ready</span>' },
  { delay: 1600, html: '<span class="term-ok">✓</span> <span class="term-info">Network defense simulator active</span>' },
  { delay: 2000, html: '<span class="term-warn">→</span> <span class="term-cmd">Platform: codedefenze.security</span>' },
  { delay: 2400, html: '<span class="term-ok">✓</span> Status: <span class="term-ok">SECURE & READY</span>' },
  { delay: 2800, html: '<span class="term-prompt">root@codedefenze:~$</span> <span class="term-cmd">enroll --course "IT+Cyber Bundle"</span>' },
  { delay: 3200, html: '<span class="term-info">Welcome. Your cybersecurity journey starts here.</span>' },
]

export default function Terminal() {
  const [visible, setVisible] = useState(0)
  const [showCursor] = useState(true)

  useEffect(() => {
    const timers = lines.map((line, i) =>
      setTimeout(() => setVisible(i + 1), line.delay),
    )
    return () => {
      timers.forEach(clearTimeout)
    }
  }, [])

  return (
    <div className="terminal" aria-label="Cybersecurity platform terminal demo">
      <div className="terminal-bar">
        <span className="terminal-dot r" />
        <span className="terminal-dot y" />
        <span className="terminal-dot g" />
        <span className="terminal-title">codedefenze — secure shell</span>
      </div>
      <div className="terminal-body">
        {lines.slice(0, visible).map((line, i) => (
          <div
            key={i}
            className="term-line"
            style={{ animationDelay: '0s' }}
            dangerouslySetInnerHTML={{ __html: line.html }}
          />
        ))}
        {showCursor && visible >= lines.length && (
          <div className="term-line" style={{ animation: 'none', opacity: 1 }}>
            <span className="term-prompt">root@codedefenze:~$</span>
            <span className="term-cursor" />
          </div>
        )}
      </div>
    </div>
  )
}
