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

## 6. When you're ready to publish live

- Deploy `backend/` somewhere that can run Node continuously (e.g. Render, Railway, a VPS)
- Deploy `frontend/` as a static build (`npm run build` inside `frontend/`, deploy the `dist/` folder) to Netlify/Vercel/your host
- Deploy `admin/` the same way as a static site, but on a **separate, non-public URL/subdomain** (e.g. `admin.codedefenze.security`) — don't link it from the public site's navigation
- Update `CORS_ORIGINS` in the backend's production `.env` to your real domains
- Update `window.CDZ_API_BASE` — add a small `<script>` in `admin/index.html` and `admin/dashboard.html` setting `window.CDZ_API_BASE = 'https://your-backend-domain.com'` before the other scripts load, so the admin panel talks to your live backend instead of localhost
