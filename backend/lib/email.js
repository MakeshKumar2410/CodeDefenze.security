// Transactional email via Resend's HTTP API — called directly with fetch,
// so no new npm dependency is needed. Completely independent from
// telegram.js: nothing here knows Telegram exists, and a failure here
// never touches the database record that was already saved.

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM
const TO_EMAIL = process.env.TO_EMAIL

// Simple, deliberately conservative email shape check — good enough to
// decide "is this safe to use as Reply-To", not a full RFC validator.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrapHtml({ title, rows, bodyLabel, bodyText, footer }) {
  const rowsHtml = rows
    .map(([label, value]) => `
      <tr>
        <td style="padding:6px 12px;color:#4a667a;font-size:13px;white-space:nowrap;">${escapeHtml(label)}</td>
        <td style="padding:6px 12px;color:#0c2d48;font-size:14px;font-weight:600;">${escapeHtml(value || '—')}</td>
      </tr>`)
    .join('')

  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;background:#f5fbff;padding:24px;">
    <div style="background:#0c2d48;color:#fff;padding:16px 20px;border-radius:10px 10px 0 0;font-weight:700;font-size:16px;">
      ${escapeHtml(title)}
    </div>
    <div style="background:#fff;border:1px solid #d4e8f5;border-top:none;border-radius:0 0 10px 10px;padding:20px;">
      <table role="presentation" style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
      ${bodyText ? `
        <div style="margin-top:16px;">
          <p style="color:#4a667a;font-size:13px;margin:0 0 4px;">${escapeHtml(bodyLabel)}</p>
          <p style="color:#0c2d48;font-size:14px;white-space:pre-wrap;margin:0;">${escapeHtml(bodyText)}</p>
        </div>` : ''}
      <p style="color:#4a667a;font-size:12px;margin-top:20px;">${escapeHtml(footer)}</p>
    </div>
  </div>`
}

async function sendViaResend({ subject, html, text, replyTo }) {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set in the backend .env file.')
  if (!EMAIL_FROM) throw new Error('EMAIL_FROM is not set in the backend .env file.')
  if (!TO_EMAIL) throw new Error('TO_EMAIL is not set in the backend .env file.')

  const payload = {
    from: EMAIL_FROM,
    to: [TO_EMAIL],
    subject,
    html,
    text,
  }
  // Only ever set from a value we've already validated as email-shaped —
  // the user's submitted data can never control From/To/Cc/Bcc, only this
  // one optional Reply-To header.
  if (replyTo && EMAIL_RE.test(replyTo)) {
    payload.reply_to = replyTo
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const rawText = await response.text()
  let data = {}
  try {
    data = JSON.parse(rawText)
  } catch {
    /* Resend returns JSON on both success and error; guard a parse failure only */
  }

  if (!response.ok) {
    throw new Error(data.message || `Resend rejected the email (status ${response.status}).`)
  }
  return data
}

export async function sendContactEmail({ id, name, email, phone, message, createdAt }) {
  const dateStr = formatDate(createdAt)
  const html = wrapHtml({
    title: 'New Contact Message — CodeDefenze',
    rows: [['Name', name], ['Email', email], ['Phone', phone], ['Submitted', dateStr], ['Message ID', id]],
    bodyLabel: 'Message',
    bodyText: message,
    footer: 'Reply directly to this email to respond to the visitor.',
  })
  const text = [
    'New Contact Message',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || '—'}`,
    '',
    'Message:',
    message || '—',
    '',
    `Submitted: ${dateStr}`,
    id ? `Message ID: ${id}` : '',
  ].join('\n')

  return sendViaResend({
    subject: 'New Contact Message — CodeDefenze',
    html,
    text,
    replyTo: email,
  })
}

export async function sendEnrollmentEmail({ id, name, email, phone, college, course, createdAt }) {
  const dateStr = formatDate(createdAt)
  const html = wrapHtml({
    title: 'New Course Enrollment — CodeDefenze',
    rows: [
      ['Name', name], ['Email', email], ['Phone', phone],
      ['College', college], ['Course', course], ['Submitted', dateStr], ['Enrollment ID', id],
    ],
    footer: 'Reply directly to this email to respond to the student.',
  })
  const text = [
    'New Course Enrollment',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || '—'}`,
    `College: ${college || '—'}`,
    `Course: ${course || '—'}`,
    '',
    `Submitted: ${dateStr}`,
    id ? `Enrollment ID: ${id}` : '',
  ].join('\n')

  return sendViaResend({
    subject: 'New Course Enrollment — CodeDefenze',
    html,
    text,
    replyTo: email,
  })
}
