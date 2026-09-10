const TO_EMAIL = process.env.TO_EMAIL

function formatTelegramText(subject, payload) {
  const lines = [subject, '']
  Object.entries(payload || {}).forEach(([key, value]) => {
    const normalized = value == null || value === '' ? '—' : String(value)
    lines.push(`${key}: ${normalized}`)
  })
  return lines.join('\n')
}

export async function sendTelegramNotification({ subject, payload }) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    return null
  }

  const text = formatTelegramText(subject, payload)
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  })

  const rawText = await response.text()
  let data = {}
  try {
    data = JSON.parse(rawText)
  } catch {
    // Telegram often returns JSON even on failures; this keeps the log readable.
  }

  console.log('--- Telegram response ---')
  console.log('Status:', response.status)
  console.log('Body:', rawText)
  console.log('---------------------------')

  if (!response.ok) {
    const err = new Error(data.description || 'Telegram bot rejected the message.')
    err.upstream = data
    throw err
  }

  return data
}

export async function sendNotificationEmail({ subject, payload }) {
  if (!TO_EMAIL) {
    throw new Error('TO_EMAIL is not set in the backend .env file.')
  }

  const response = await fetch(`https://formsubmit.co/ajax/${TO_EMAIL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      _subject: subject,
      _template: 'table',
      _captcha: 'false',
    }),
  })

  const rawText = await response.text()
  let data = {}
  try {
    data = JSON.parse(rawText)
  } catch {
    /* formsubmit sometimes returns non-JSON on error pages */
  }

  // Verbose on purpose: this is the fastest way to tell whether FormSubmit
  // actually sent your message, is waiting on one-time activation, or
  // rejected the request outright. Check this terminal after a test submit.
  console.log('--- FormSubmit response ---')
  console.log('Status:', response.status)
  console.log('Body:', rawText)
  console.log('---------------------------')

  if (!response.ok) {
    const err = new Error(data.message || 'Email service rejected the message.')
    err.upstream = data
    throw err
  }

  try {
    await sendTelegramNotification({ subject, payload })
  } catch (err) {
    console.error('Telegram notification failed:', err.message)
  }

  return data
}
