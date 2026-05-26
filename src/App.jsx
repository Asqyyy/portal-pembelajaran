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
    const result = register(username, password, email);
    return result;
  }, [register]);

  const handleLogout = () => {
    logout();
    setRole("student");
    setCurrentPage("dashboard");
  };

  return (
    <div className="min-h-screen">
      {/* Inner navbar for non-dashboard, non-auth pages */}
      {currentPage !== "dashboard" && currentPage !== "login" && currentPage !== "register" && (
        <div className="sticky top-0 z-50">
          <nav className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage("dashboard")}
                className="text-white/80 hover:text-white text-sm flex items-center gap-1 transition-colors"
              >
                <span className="text-xl">🎓</span>
                <span className="font-bold">PortalPembelajaran</span>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage("dashboard")}
                className="px-4 py-1.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                🏠 Beranda
              </button>
              <button
                onClick={() => setCurrentPage("courses")}
                className="px-4 py-1.5 rounded-lg text-sm bg-white/20 text-white transition-all"
              >
                📚 Kursus Saya
              </button>

              {user ? (
                <>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none"
                  >
                    <option value="student" className="bg-gray-800">👨‍🎓 Siswa</option>
                    <option value="lecturer" className="bg-gray-800">👨‍🏫 Pengajar</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-xs text-white/50 hover:text-white/80 transition-colors"
                    >
                      Keluar
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setCurrentPage("login")}
                  className="px-4 py-1.5 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-all flex items-center gap-1"
                >
                  <span>🔐</span> Masuk
                </button>
              )}
            </div>
          </nav>
        </div>
      )}

      {currentPage === "dashboard" && (
        <Dashboard
          setCurrentPage={setCurrentPage}
          role={role}
          user={user}
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
  );
}
