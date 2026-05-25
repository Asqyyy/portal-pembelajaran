import { useState } from "react";

export default function Navbar({ currentPage, setCurrentPage, role, setRole }) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <nav className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentPage("dashboard")}>
          <span className="text-3xl">🎓</span>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Portal<span className="text-purple-400">Pembelajaran</span>
          </h1>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage("dashboard")}
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
              <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-2xl p-2 min-w-[200px] z-50 animate-[fadeIn_0.2s_ease]">
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
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-400"
          >
            <option value="student" className="bg-gray-800 text-white">👨‍🎓 Siswa</option>
            <option value="lecturer" className="bg-gray-800 text-white">👨‍🏫 Pengajar</option>
          </select>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
            {role === "lecturer" ? "P" : "S"}
          </div>
        </div>
      </div>
    </nav>
  );
}
