# Codedefenze.security — v2

Rebuilt with three separate parts, a real admin panel, and every bug from
the earlier version fixed. Visual style is unchanged — only structure and
logic changed.

```
CodeDefenze/
├── frontend/   the public website (React + Vite) — what visitors see
├── backend/    the API + database (Node/Express) — powers both frontend and admin
└── admin/      the admin panel (plain HTML/CSS/JS, no build step) — for you only
```

---

## 1. What's in each folder

**`frontend/`** — your public site: Home, About, Course, Enroll, Contact,
Resources, Certificate. Course content and free resources are no longer
hardcoded — they're now pulled live from the backend, so you can edit them
from the admin panel without touching code.

**`backend/`** — one Express server that:
- stores enrollments, contact messages, testimonials, courses, and resources in `backend/data/db.json` (created automatically on first run — no database software to install)
- emails you a notification for every enrollment and contact form submission (same as before)
- handles admin login securely (see below)

**`admin/`** — a private dashboard only you use. Not linked from the public
site anywhere, and not part of the public site's code, so visitors never see
it or download its code. From here you can:
- see enrollment/message/review counts at a glance
- view and update enrollment status (new / contacted / converted), and delete
- read and mark contact messages as read, and delete
- approve or delete testimonials before they go live on the site
- add, edit, or delete course bundles and their syllabus/outcomes
- add, edit, or delete free resources (notes/videos/demo links)
- upload, replace, or delete a recorded video for each **Daily Class** inside a course, and preview it before publishing
- create student logins and control exactly which courses each student can see and watch (**Students** tab)

---

## 2. One-time setup

You need [Node.js](https://nodejs.org) installed (v18 or newer). Then, from
the `CodeDefenze` folder:

1. **Install dependencies for all three parts:**
   ```
   npm run install:all
   ```
   (This runs `npm install` inside `frontend/`, `backend/`, and `admin/`.)

2. **Set up your backend environment file:**
   - Go into `backend/`, copy `.env.example` to a new file named `.env`
   - Fill in:
     - `TO_EMAIL` — your email for enrollment/contact notifications (same as before)
     - `JWT_SECRET` — any long random string (the file tells you a command to generate one)
     - `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` — your admin panel login (pick your own values)
     - `CORS_ORIGINS` — leave as default unless you change the dev ports

3. **Create your admin login:**
   ```
   cd backend
   npm run seed:admin
   ```
   This creates one admin account using the email/password you set in `.env`.
   You can re-run this anytime to reset your password.

---

## 3. Running it locally

From the root `CodeDefenze` folder, run everything at once:
```
npm run dev:all
```
This starts:
- **frontend** → http://localhost:5173 (your public site)
- **backend** → http://localhost:5000 (the API)
- **admin** → http://localhost:5174 (your admin panel)

Or start each one individually in its own terminal if you prefer:
```
npm run dev:frontend
npm run dev:backend
npm run dev:admin
```

**To use the admin panel:** open http://localhost:5174, log in with the
email/password you set in step 2, and you'll land on the dashboard.

---

## 4. Bugs from the old version that are now fixed

| Bug | Fix |
|---|---|
| Admin PIN was a plain string visible in the site's public JS, and login could be bypassed via browser dev tools | Real login now lives only in the backend, with hashed passwords and a secure session cookie — nothing admin-related ships in the public site anymore |
| Testimonials were stored per-browser (localStorage) — a submitted review never actually appeared for other visitors, despite the message saying it was "live" | Reviews are now stored on the server; new ones go in as **pending** and only appear site-wide once you approve them in the admin panel |
| No database — enrollments and messages were only emailed, never saved anywhere you could look up later | Both are now saved in `backend/data/db.json` and viewable/manageable in the admin panel |
| Contact/enroll forms had no spam protection | Rate limiting added on all public form endpoints |
| Enroll page didn't check if the backend was reachable before submitting (Contact page did) | Enroll now does the same health check as Contact |
| Course dropdown on Enroll/Review forms only had one hardcoded option | Now populates dynamically from your courses list — scales automatically when you add more bundles |
| No 404 page — unmatched URLs rendered blank | Added a proper "Page Not Found" page matching your site style |
| Every page shared one static title/description (bad for SEO) | Each page now sets its own title; added `robots.txt`, `sitemap.xml`, and basic Open Graph tags |
| Small dead-code timer bug in the homepage terminal animation | Cleaned up |

---

## 5. Recorded classes & student access

Each course can have **Daily Classes** (Day 01, Day 02, …), each with its own
uploaded video. Students only see the courses — and only the classes inside
them — that you've explicitly granted them access to; every check is
enforced by the backend, not just hidden in the frontend.

**As the admin:**
1. Go to **Courses** → pick a course → **Daily Classes**.
2. **+ New Class** to add a day (e.g. "Day 01 — Introduction").
3. **Upload Video** (or **Replace**/**Delete Video** later) — MP4, WebM, or
   MOV, up to 1GB. Videos are saved locally under `backend/uploads/videos/`
   (never committed to git, never served as static files) and only ever
   streamed back through an authenticated, authorized route.
4. Go to **Students** → **+ New Student** to create a login (name, email,
   password) and tick which course(s) they can access. Toggle access for
   any student at any time from the same tab.

**As a student**, they go to `/student/login` on the public site, log in,
and see **My Courses** → pick a course → **Daily Classes** → **Watch Video**.
If they try another course's video URL directly (or one they've lost access
to), the backend returns `403 Forbidden` regardless of what the frontend
shows.

---

## 6. Notifications (Email + Telegram)

Every Contact form and Enroll Now submission is saved to `db.json` first —
that's the only thing that determines whether the visitor sees success.
Email (via [Resend](https://resend.com)) and Telegram then fire
**independently**: either, both, or neither can fail without affecting the
save, the visitor's response, or each other. Check your backend terminal
for `[EMAIL]` / `[TELEGRAM]` success/failure logs after a test submission.

Required `.env` values for this to work:
```
RESEND_API_KEY=      # from resend.com
EMAIL_FROM=          # must be verified in your Resend account
TO_EMAIL=            # where notification emails are sent
TELEGRAM_BOT_TOKEN=  # from @BotFather
TELEGRAM_CHAT_ID=    # the chat/user id your bot should message
```
Leaving Telegram's two variables blank just means Telegram notifications
are skipped (logged as a failure) — email and the admin panel still work.

## 7. Video storage — Google Drive (active) and R2 (prepared)

Course videos are no longer stored on local disk — they're uploaded to
Google Drive by the backend, organized automatically as
`CodeDefenze/Courses/<Course Name>/Day-01/`, `Day-02/`, etc. Nothing about
this needs a course name to be hard-coded; folders are created the first
time they're needed.

Cloudflare R2 is scaffolded (`backend/lib/storage/r2Storage.js`) but
**not implemented or active** — every method in it currently throws a clear
"not configured" error. To activate it later: implement the four methods
using the S3-compatible AWS SDK against the `R2_*` env vars already present
in `.env.example`, then set `STORAGE_PROVIDER=r2`. Nothing in
`routes/classes.js` needs to change — that's the point of the storage
abstraction in `backend/lib/storage/`.

### Google Cloud + Drive OAuth setup (one-time)

1. Go to [console.cloud.google.com](https://console.cloud.google.com), create a project (or use an existing one).
2. **Enable the Google Drive API**: APIs & Services → Library → search "Google Drive API" → Enable.
3. **Create OAuth credentials**: APIs & Services → Credentials → Create Credentials → OAuth client ID.
   - Application type: **Web application**
   - Authorized redirect URI: `https://developers.google.com/oauthplayground` (used only to generate your refresh token once — see step 5)
   - Save the **Client ID** and **Client Secret** — these go in `.env`.
4. **Configure the OAuth consent screen** (if prompted): External or Internal, doesn't matter for personal use; add your own Google account as a test user if it asks.
5. **Get a refresh token** using [Google's OAuth Playground](https://developers.google.com/oauthplayground):
   - Click the gear icon (top right) → check "Use your own OAuth credentials" → paste your Client ID and Client Secret.
   - In the left panel, find and select the scope `https://www.googleapis.com/auth/drive` (full Drive access — needed since the backend creates folders and uploads files).
   - Click "Authorize APIs", sign in with the Google account that should own the video storage, approve access.
   - Click "Exchange authorization code for tokens" — copy the **Refresh token** shown. This goes in `GOOGLE_REFRESH_TOKEN` and does not expire unless you revoke it.
6. **Create the root Drive folder**: in Google Drive, create a folder named `CodeDefenze`. Open it, copy the ID from the URL (`https://drive.google.com/drive/folders/`**`THIS_PART`**), set it as `GOOGLE_DRIVE_FOLDER_ID`.
7. Fill in `backend/.env`:
   ```
   STORAGE_PROVIDER=google_drive
   GOOGLE_CLIENT_ID=<from step 3>
   GOOGLE_CLIENT_SECRET=<from step 3>
   GOOGLE_REDIRECT_URI=https://developers.google.com/oauthplayground
   GOOGLE_REFRESH_TOKEN=<from step 5>
   GOOGLE_DRIVE_FOLDER_ID=<from step 6>
   ```

### Known limitation (be aware of this)

Videos are streamed back to students by the backend fetching them from
Drive and piping the response through — the Drive file itself is never
made public. This works well for normal playback and seeking in most
cases, but Drive's `alt=media` endpoint doesn't have the same
purpose-built HTTP range guarantees as a real video CDN or object store.
If you notice occasional seeking/scrubbing hiccups on very large files,
that's the practical ceiling of this approach — it's the main reason R2
(a real object store) is prepared as the next step rather than treated as
optional polish.

### Installing the new dependency

`googleapis` was added to `backend/package.json` but **not installed** —
I have no network access in this environment to run `npm install` myself.
Run `npm install` inside `backend/` (or `npm run install:all` from the
root) before starting the server.

## 8. When you're ready to publish live

- Deploy `backend/` somewhere that can run Node continuously (e.g. Render, Railway, a VPS)
- Deploy `frontend/` as a static build (`npm run build` inside `frontend/`, deploy the `dist/` folder) to Netlify/Vercel/your host
- Deploy `admin/` the same way as a static site, but on a **separate, non-public URL/subdomain** (e.g. `admin.codedefenze.security`) — don't link it from the public site's navigation
- Update `CORS_ORIGINS` in the backend's production `.env` to your real domains
- Update `window.CDZ_API_BASE` — add a small `<script>` in `admin/index.html` and `admin/dashboard.html` setting `window.CDZ_API_BASE = 'https://your-backend-domain.com'` before the other scripts load, so the admin panel talks to your live backend instead of localhost
