import { useEffect, useState } from 'react'

export default function FloatingActions() {
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    function onScroll() {
      setShowTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="float-actions">
      <a
        className="float-btn float-wa"
        href="https://wa.me/918940364233"
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        title="WhatsApp"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
          <path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z" />
          <path d="M12.04 2C6.5 2 2.01 6.49 2.01 12.02c0 1.77.46 3.45 1.28 4.92L2 22l5.2-1.36A9.97 9.97 0 0 0 12.04 22C17.57 22 22 17.52 22 12S17.57 2 12.04 2zm0 18.13c-1.6 0-3.1-.43-4.4-1.18l-.32-.19-3.09.81.83-3.01-.2-.33a8.1 8.1 0 0 1-1.25-4.33c0-4.49 3.65-8.14 8.14-8.14s8.14 3.65 8.14 8.14-3.65 8.14-8.14 8.14z" />
        </svg>
      </a>
      {showTop && (
        <button
          type="button"
          className="float-btn float-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          title="Back to top"
        >
          ↑
        </button>
      )}
    </div>
  )
}
