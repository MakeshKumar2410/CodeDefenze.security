import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import FloatingActions from './components/FloatingActions'
import Home from './pages/Home'
import About from './pages/About'
import Course from './pages/Course'
import CourseDetail from './pages/CourseDetail'
import Enroll from './pages/Enroll'
import Contact from './pages/Contact'
import Resources from './pages/Resources'
import Certificate from './pages/Certificate'
import StudentLogin from './pages/StudentLogin'
import StudentDashboard from './pages/StudentDashboard'
import StudentCourseClasses from './pages/StudentCourseClasses'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/course" element={<Course />} />
          <Route path="/course/:id" element={<CourseDetail />} />
          <Route path="/enroll" element={<Enroll />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/certificate" element={<Certificate />} />
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/courses/:courseId" element={<StudentCourseClasses />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <FloatingActions />
    </>
  )
}
