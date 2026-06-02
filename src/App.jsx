import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { useAuth } from "./data/auth";
import Dashboard from "./components/Dashboard";
import CourseList from "./components/CourseList";
import CourseDetail from "./components/CourseDetail";
import Login from "./components/Login";
import Register from "./components/Register";
import Navbar from "./components/Navbar";
import NotFound from "./components/NotFound";

function Footer() {
  return (
    <footer className="app-footer">
      <p>&copy; 2026 Portal Pembelajaran. Platform belajar online untuk madrasah & sekolah.</p>
    </footer>
  );
}

function MainLayout({ role, user, logout }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar role={role} user={user} onLogout={logout} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function AppLayout() {
  const { user, loading, login, register, logout } = useAuth();
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
      {/* Auth Routes */}
      <Route path="/login" element={<Login onLogin={login} />} />
      <Route path="/register" element={<Register onRegister={register} />} />

      {/* Main Routes with layout */}
      <Route element={<MainLayout role={role} user={user} logout={logout} />}>
        <Route path="/" element={<Dashboard role={role} user={user} onLogout={logout} />} />
        <Route path="/courses" element={<CourseList role={role} user={user} />} />
        <Route path="/courses/:courseId" element={<CourseDetail role={role} user={user} />} />
      </Route>

      {/* 404 Catch All */}
      <Route path="*" element={<NotFound />} />
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
