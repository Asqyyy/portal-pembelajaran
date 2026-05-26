import { useState, useCallback } from "react";
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

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const role = user?.role || "student";
  const { user, loading, login, register, logout, updateUser } = useAuth();

  const handleLogin = useCallback(async (username, password) => {
    const result = await login(username, password);
    if (result.success) {
      setCurrentPage("dashboard");
    }
    return result;
  }, [login]);

  const handleRegister = useCallback(async (username, password, email) => {
    const result = await register(username, password, email);
    return result;
  }, [register]);

  const handleLogout = () => {
    logout();
    setCurrentPage("dashboard");
  };

  // Show loading while auth is being validated
  if (loading && currentPage !== "login" && currentPage !== "register") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  const showNav = currentPage !== "dashboard" && currentPage !== "login" && currentPage !== "register";
  const isDashboard = currentPage === "dashboard";

  return (
    <div className={isDashboard ? "min-h-screen" : "min-h-screen flex flex-col"}>
      {/* Navbar for non-dashboard / non-auth pages */}
      {showNav && (
        <Navbar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          role={role}
          user={user}
          onLogout={handleLogout}
        />
      )}

      <div className={isDashboard ? "" : "flex-1 page-enter"}>
        {currentPage === "dashboard" && (
          <Dashboard
            setCurrentPage={setCurrentPage}
            role={role}
            user={user}
            onLogout={handleLogout}
          />
        )}

        {currentPage === "login" && (
          <Login
            onLogin={handleLogin}
            onSwitchToRegister={() => setCurrentPage("register")}
          />
        )}

        {currentPage === "register" && (
          <Register
            onRegister={handleRegister}
            onSwitchToLogin={(username) => {
              setCurrentPage("login");
            }}
          />
        )}

        {currentPage === "courses" && (
          <CourseList
            setCurrentPage={setCurrentPage}
            setSelectedCourse={setSelectedCourse}
            role={role}
            user={user}
          />
        )}

        {currentPage === "courseDetail" && selectedCourse && (
          <CourseDetail
            courseId={selectedCourse.id}
            courseCode={selectedCourse.courseCode}
            setCurrentPage={setCurrentPage}
            role={role}
            user={user}
          />
        )}
      </div>

      {/* Footer — show on all pages */}
      <Footer />
    </div>
  );
}
