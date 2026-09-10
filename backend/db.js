import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'data', 'db.json')

const seedCourse = {
  id: 'course-1',
  title: 'IT Infrastructure & Cyber Security Bundle',
  description:
    'A complete training path combining systems, networking, and cybersecurity — built for students who want career-ready skills.',
  duration: '12 Weeks',
  fee: '₹24,999',
  mode: 'Online + Labs',
  published: true,
  syllabus: [
    { mod: 'Module 01', title: 'IT Infrastructure Foundations', desc: 'Hardware, OS essentials, virtualization, and core system administration.' },
    { mod: 'Module 02', title: 'Networking & Protocols', desc: 'TCP/IP, LAN/WAN, routing, switching, DNS, DHCP, and troubleshooting.' },
    { mod: 'Module 03', title: 'Security Fundamentals', desc: 'CIA triad, risk basics, access control, cryptography intro, and policies.' },
    { mod: 'Module 04', title: 'Threats & Vulnerability Management', desc: 'Malware types, attack surfaces, scanning, patching, and hardening.' },
    { mod: 'Module 05', title: 'Network Defense & Monitoring', desc: 'Firewalls, IDS/IPS concepts, logging, SIEM awareness, and SOC basics.' },
    { mod: 'Module 06', title: 'Ethical Hacking Essentials', desc: 'Reconnaissance, enumeration, web app basics, and responsible disclosure.' },
    { mod: 'Module 07', title: 'Cloud & Hybrid Security Intro', desc: 'Cloud models, shared responsibility, identity basics, and secure configs.' },
    { mod: 'Module 08', title: 'Capstone Lab & Certification', desc: 'End-to-end project, assessment, and certificate of completion.' },
  ],
  learnings: [
    'Design and manage core IT infrastructure components',
    'Configure and troubleshoot enterprise networking basics',
    'Identify common cyber threats and attack vectors',
    'Apply hardening and defensive security controls',
    'Use security tools for scanning and monitoring',
    'Understand ethical hacking methodology responsibly',
    'Document findings and communicate risk clearly',
    'Prepare for entry-level IT and security roles',
  ],
}

const seedResources = [
  { id: 'res-1', type: 'Free Notes', tag: 'PDF', title: 'Networking Fundamentals Cheat Sheet', href: '#' },
  { id: 'res-2', type: 'Free Notes', tag: 'PDF', title: 'CIA Triad & Security Basics Notes', href: '#' },
  { id: 'res-3', type: 'Free Notes', tag: 'PDF', title: 'Linux Commands for Security Ops', href: '#' },
  { id: 'res-4', type: 'YouTube Videos', tag: 'YT', title: 'Intro to Cybersecurity Career Paths', href: 'https://www.youtube.com' },
  { id: 'res-5', type: 'YouTube Videos', tag: 'YT', title: 'How Firewalls Protect Networks', href: 'https://www.youtube.com' },
  { id: 'res-6', type: 'YouTube Videos', tag: 'YT', title: 'Lab Walkthrough: Port Scanning Basics', href: 'https://www.youtube.com' },
  { id: 'res-7', type: 'Demo Class', tag: 'LIVE', title: 'Free Demo Class — Bundle Overview', href: '/enroll' },
  { id: 'res-8', type: 'Demo Class', tag: 'LIVE', title: 'Hands-on Lab Preview Session', href: '/enroll' },
  { id: 'res-9', type: 'Demo Class', tag: 'LIVE', title: 'Q&A with Lead Trainer', href: '/contact' },
]

const seedTestimonials = [
  {
    id: 'test-1',
    name: 'Priya S.',
    college: 'Anna University',
    course: 'IT Infrastructure & Cyber Security Bundle',
    review:
      'The hands-on labs and real-world scenarios made cybersecurity concepts click. Makeshkumar explains complex topics with clarity.',
    approved: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'test-2',
    name: 'Arjun K.',
    college: 'SRM Institute',
    course: 'IT Infrastructure & Cyber Security Bundle',
    review:
      'From networking basics to threat detection — the bundle covers everything. Supportive team and a strong placement-focused approach.',
    approved: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'test-3',
    name: 'Divya R.',
    college: 'PSG College of Technology',
    course: 'IT Infrastructure & Cyber Security Bundle',
    review:
      'Demo classes helped me decide. The syllabus is industry-aligned and the certificate adds real value to my resume.',
    approved: true,
    createdAt: new Date().toISOString(),
  },
]

const defaultData = {
  admins: [],
  enrollments: [],
  messages: [],
  testimonials: seedTestimonials,
  courses: [seedCourse],
  resources: seedResources,
  // Student accounts. Each student has courseIds: the list of course ids the
  // admin has explicitly granted them access to (their "My Courses").
  students: [],
  // Daily/recorded classes, grouped by courseId. Video fields are populated
  // once the admin uploads a video; a class can exist with no video yet.
  classes: [],
}

function ensureDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2))
  }
}

const TYPE_MIGRATION = { pdf: 'Free Notes', video: 'YouTube Videos', demo: 'Demo Class' }

export function readDB() {
  ensureDB()
  const raw = fs.readFileSync(DB_PATH, 'utf-8')
  const data = JSON.parse(raw)

  // One-time migration for databases created before resource "type" switched
  // from fixed codes (pdf/video/demo) to free-text section names. Keeps any
  // courses/resources/enrollments you already added through the admin panel.
  let migrated = false
  data.resources = (data.resources || []).map((r) => {
    if (TYPE_MIGRATION[r.type]) {
      migrated = true
      return { ...r, type: TYPE_MIGRATION[r.type] }
    }
    return r
  })

  // The approval step for testimonials was removed — anything left over
  // from before (approved: false) is now made visible automatically.
  data.testimonials = (data.testimonials || []).map((t) => {
    if (!t.approved) {
      migrated = true
      return { ...t, approved: true }
    }
    return t
  })

  // Backfill arrays that didn't exist in older db.json files.
  if (!Array.isArray(data.students)) {
    data.students = []
    migrated = true
  }
  if (!Array.isArray(data.classes)) {
    data.classes = []
    migrated = true
  }

  if (migrated) writeDB(data)

  return data
}

export function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

export function nextId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
