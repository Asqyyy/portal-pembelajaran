import { useState } from "react";

export default function Navbar({ currentPage, setCurrentPage, role, user, onLogout }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { page: "dashboard", icon: "🏠", label: "Beranda" },
    { page: "courses", icon: "📚", label: "Kursus Saya", hasDropdown: true },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer flex-shrink-0"
          onClick={() => { setCurrentPage("dashboard"); setMobileOpen(false); }}
        >
          <img src="/logo.png" alt="Portal Pembelajaran Logo" className="w-8 h-8 md:w-10 md:h-10 drop-shadow-md" />
          <span className="text-lg md:text-xl font-bold text-white tracking-tight">
            Portal<span className="text-purple-300">Pembelajaran</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => { setCurrentPage("dashboard"); setShowDropdown(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentPage === "dashboard"
                ? "bg-white/20 text-white"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            🏠 Beranda
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentPage === "courses"
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              📚 Kursus Saya ▾
            </button>
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-2xl p-2 min-w-[220px] z-20 animate-[fadeIn_0.2s_ease]">
                  <button
                    onClick={() => {
                      setCurrentPage("courses");
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-blue-50 text-blue-700 font-medium text-sm transition-colors flex items-center gap-2"
                  >
                    <span>📖</span> Sedang Dipelajari
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPage("courses");
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-purple-50 text-purple-700 font-medium text-sm transition-colors flex items-center gap-2"
                  >
                    <span>🎓</span> Sedang Diajar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right section */}
        <div className="hidden md:flex items-center gap-3">
          {user && (
            <span className="bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-2 flex items-center gap-2">
              {role === "lecturer" ? "👨‍🏫 Pengajar" : "👨‍🎓 Siswa"}
            </span>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={onLogout}
                className="text-xs text-white/50 hover:text-white/80 transition-colors"
                title="Keluar"
              >
                Keluar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCurrentPage("login")}
              className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-all flex items-center gap-1"
            >
              <span>🔐</span> Masuk
            </button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-all"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/5 backdrop-blur-md border-t border-white/10 px-4 py-3 animate-[fadeIn_0.2s_ease]">
          <div className="space-y-2">
            <button
              onClick={() => { setCurrentPage("dashboard"); setMobileOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentPage === "dashboard"
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              🏠 Beranda
            </button>
            <button
              onClick={() => { setCurrentPage("courses"); setMobileOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentPage === "courses"
                  ? "bg-white/20 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              📚 Kursus Saya
            </button>

            <hr className="border-white/10" />

            {user && (
              <div className="w-full bg-white/10 border border-white/20 text-white text-sm rounded-lg px-4 py-2.5 flex items-center gap-2">
                {role === "lecturer" ? "👨‍🏫 Pengajar" : "👨‍🎓 Siswa"}
              </div>
            )}

            {user ? (
              <button
                onClick={() => { onLogout(); setMobileOpen(false); }}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                🚪 Keluar
              </button>
            ) : (
              <button
                onClick={() => { setCurrentPage("login"); setMobileOpen(false); }}
                className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <span>🔐</span> Masuk
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
