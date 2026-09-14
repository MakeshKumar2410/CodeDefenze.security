// Telegram notifications are completely independent from email — this file
// has no knowledge of email.js, and nothing in here ever throws in a way
// that could block a save or an email send. Callers decide what to do with
// failures (routes/*.js just logs them).

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

function formatDate(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

async function sendTelegramMessage(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    throw new Error('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set in the backend .env file.')
  }

  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      disable_web_page_preview: true,
    }),
  })

  const rawText = await response.text()
  let data = {}
  try {
    data = JSON.parse(rawText)
  } catch {
    /* Telegram normally returns JSON even on failure; this just guards a parse error */
  }

  if (!response.ok) {
    throw new Error(data.description || `Telegram API rejected the message (status ${response.status}).`)
  }
  return data
}

export async function sendContactTelegram({ id, name, email, phone, message, createdAt }) {
  const text = [
    '🔔 NEW CONTACT MESSAGE',
    '',
    `👤 Name: ${name}`,
    `📧 Email: ${email}`,
    `📱 Phone: ${phone || '—'}`,
    '',
    '💬 Message:',
    message || '—',
    '',
    `🕐 Time: ${formatDate(createdAt)}`,
    id ? `\nID: ${id}` : '',
  ].join('\n')

  return sendTelegramMessage(text)
}

export async function sendEnrollmentTelegram({ id, name, email, phone, course, createdAt }) {
  const text = [
    '🎓 NEW COURSE ENROLLMENT',
    '',
    `👤 Name: ${name}`,
    `📧 Email: ${email}`,
    `📱 Phone: ${phone || '—'}`,
    '',
    '📚 Course:',
    course || '—',
    '',
    `🕐 Time: ${formatDate(createdAt)}`,
    id ? `\nID: ${id}` : '',
  ].join('\n')

  return sendTelegramMessage(text)
}
