import { useState, useCallback } from "react";
import { useAuth } from "./data/auth";
import Dashboard from "./components/Dashboard";
import CourseList from "./components/CourseList";
import CourseDetail from "./components/CourseDetail";
import Login from "./components/Login";
import Register from "./components/Register";

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [role, setRole] = useState("student");
  const { user, login, register, logout, updateUser } = useAuth();

  const handleLogin = useCallback((username, password) => {
    const result = login(username, password);
    if (result.success) {
      setRole(result.user.role);
      setCurrentPage("dashboard");
    }
    return result;
  }, [login]);

  const handleRegister = useCallback((username, password, email) => {
    return register(username, password, email);
  }, [register]);

  const handleLogout = () => {
    logout();
    setRole("student");
    setCurrentPage("dashboard");
  };

  // Shared secondary navbar for non-dashboard, non-auth pages
  const SecondaryNav = () => (
    <div className="sticky top-0 z-50">
      <nav className="secondary-nav">
        <button
          onClick={() => setCurrentPage("dashboard")}
          className="secondary-nav-logo"
          id="sec-nav-logo"
        >
          <span className="secondary-nav-logo-icon">🎓</span>
          <span className="secondary-nav-logo-text">
            Portal<span className="text-purple-600">Pembelajaran</span>
          </span>
        </button>

        <div className="secondary-nav-links">
          <button
            onClick={() => setCurrentPage("dashboard")}
            className={`secondary-nav-link ${currentPage === "dashboard" ? "secondary-nav-link-active" : ""}`}
            id="sec-nav-home"
          >
            🏠 Beranda
          </button>
          <button
            onClick={() => setCurrentPage("courses")}
            className={`secondary-nav-link ${currentPage === "courses" || currentPage === "courseDetail" ? "secondary-nav-link-active" : ""}`}
            id="sec-nav-courses"
          >
            📚 Kursus Saya
          </button>
        </div>

        <div className="secondary-nav-right">
          {user ? (
            <>
              <div className="secondary-role-badge">
                <span>{role === "lecturer" ? "👨‍🏫" : "👨‍🎓"}</span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="secondary-role-select"
                  id="sec-role-select"
                >
                  <option value="student">Siswa</option>
                  <option value="lecturer">Pengajar</option>
                </select>
              </div>
              <div className="secondary-user-group">
                <div className="secondary-avatar">{user.username.charAt(0).toUpperCase()}</div>
                <span className="secondary-username">{user.username}</span>
                <button onClick={handleLogout} className="secondary-logout-btn" id="sec-logout-btn">
                  Keluar
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setCurrentPage("login")}
              className="secondary-login-btn"
              id="sec-login-btn"
            >
              🔐 Masuk
            </button>
          )}
        </div>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Show secondary nav only on inner pages */}
      {currentPage !== "dashboard" && currentPage !== "login" && currentPage !== "register" && (
        <SecondaryNav />
      )}

      {currentPage === "dashboard" && (
        <Dashboard
          setCurrentPage={setCurrentPage}
          role={role}
          setRole={setRole}
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
          onSwitchToLogin={() => setCurrentPage("login")}
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
  );
}
