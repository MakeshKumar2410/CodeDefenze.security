/** Brand text without space: codedefenze.security */
export default function Brand({ className = '' }) {
  return (
    <span className={`brand-text ${className}`.trim()}>
      CodeDefenze<span className="brand-accent">.security</span>
    </span>
  )
}
