import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "./data/auth";
import Dashboard from "./components/Dashboard";
import CourseList from "./components/CourseList";
import CourseDetail from "./components/CourseDetail";
import Login from "./components/Login";
import Register from "./components/Register";
import Navbar from "./components/Navbar";

function Footer() {
  return (
    <footer className="app-footer">
      <p>&copy; 2026 Portal Pembelajaran. Platform belajar online untuk madrasah & sekolah.</p>
    </footer>
  );
}

function AppLayout() {
  const { user, loading, login, register, logout, updateUser } = useAuth();
  const role = user?.role || "student";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard role={role} user={user} onLogout={logout} />} />
      <Route path="/login" element={<Login onLogin={login} />} />
      <Route path="/register" element={<Register onRegister={register} />} />
      <Route path="/courses" element={
        <>
          <Navbar role={role} user={user} onLogout={logout} />
          <div className="flex-1 page-enter">
            <CourseList role={role} user={user} />
          </div>
          <Footer />
        </>
      } />
      <Route path="/courses/:courseId" element={
        <>
          <Navbar role={role} user={user} onLogout={logout} />
          <div className="flex-1 page-enter">
            <CourseDetail role={role} user={user} />
          </div>
          <Footer />
        </>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
