export default function Dashboard({ setCurrentPage, role, user, onLogout }) {
  const icons = ["📐", "🔬", "📖", "💡", "🧬", "🌍", "🧮", "🎯", "📏", "⚛️", "📚", "🏛️"];

  return (
    <div className="dashboard-bg">
      <div className="floating-icons">
        {icons.map((icon, i) => (
          <span key={i} className="floating-icon">{icon}</span>
        ))}
      </div>

      <div className="relative z-10 px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto flex flex-col min-h-screen">
        {/* Header Row: Logo + Nav + Role */}
        <div className="flex items-center justify-between mb-8 sm:mb-12 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl">🎓</span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
              Portal<span className="text-purple-400">Pembelajaran</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Nav links inside dashboard */}
            <button
              onClick={() => setCurrentPage("dashboard")}
              className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-white/20 text-white transition-all"
            >
              🏠 Beranda
            </button>
            <button
              onClick={() => setCurrentPage("courses")}
              className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
            >
              📚 Kursus Saya
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-white/20 mx-1 hidden sm:block" />

            {/* Role indicator */}
            {user ? (
              <span className="bg-white/10 border border-white/20 text-white text-xs sm:text-sm rounded-lg px-3 py-2 flex items-center gap-2">
                {role === "lecturer" ? "👨‍🏫 Pengajar" : "👨‍🎓 Siswa"}
              </span>
            ) : (
              <button
                onClick={() => setCurrentPage("login")}
                className="px-3 sm:px-4 py-2 bg-white/10 backdrop-blur text-white/60 border border-white/20 rounded-lg text-xs sm:text-sm hover:text-white hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <span>🔐</span> Masuk
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={onLogout}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors hidden sm:block"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center text-white/40 text-xs" />
            )}
          </div>
        </div>

        {/* Hero Section: Left text + Right stats */}
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 flex-1">
          {/* Left: Text */}
          <div className="flex-1 text-center lg:text-left lg:pl-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 mb-6 border border-white/10">
              <span className="text-sm text-purple-300">
                {user ? `🎓 Selamat datang, ${user.username}!` : "🎓 Selamat Datang di"}
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Platform{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Belajar
              </span>
            </h2>
            <p className="text-base sm:text-lg text-white/60 max-w-xl mb-8 sm:mb-10 leading-relaxed">
              Platform belajar online untuk siswa Madrasah Aliyah dan SMA.
              Temukan mata pelajaranmu, akses materi, kumpulkan tugas, dan raih prestasi terbaik.
            </p>

            <div className="flex flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start">
              <button
                onClick={() => setCurrentPage("courses")}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold text-base sm:text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <span>📖</span> Jelajahi Kursus
              </button>
              {user ? (
                <button
                  onClick={() => setCurrentPage("courses")}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-base sm:text-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                  <span>🎓</span> Mulai Mengajar
                </button>
              ) : (
                <button
                  onClick={() => setCurrentPage("register")}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-white/5 backdrop-blur text-white/80 border border-white/20 rounded-xl font-semibold text-base sm:text-lg hover:bg-white/10 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                  <span>📝</span> Daftar untuk Mengajar
                </button>
              )}
            </div>
          </div>

          {/* Right: Stats Grid */}
          <div className="flex-shrink-0 w-full max-w-xs lg:max-w-sm lg:ml-auto lg:mr-4 mt-6 lg:mt-0">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { icon: "📚", value: "21+", label: "Mata Pelajaran", color: "from-blue-400/20 to-blue-500/10" },
                { icon: "👨‍🏫", value: "Siap", label: "Untuk Pengajar", color: "from-purple-400/20 to-purple-500/10" },
                { icon: "🎯", value: "Mandiri", label: "Belajar Fleksibel", color: "from-pink-400/20 to-pink-500/10" },
                { icon: "🏛️", value: "MA/SMA", label: "Setara Aliyah", color: "from-orange-400/20 to-orange-500/10" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`bg-gradient-to-br ${stat.color} backdrop-blur rounded-2xl p-4 sm:p-5 border border-white/10 hover:border-white/20 hover:scale-[1.02] transition-all`}
                >
                  <div className="text-2xl sm:text-3xl mb-2">{stat.icon}</div>
                  <div className="text-white font-bold text-lg sm:text-xl">{stat.value}</div>
                  <div className="text-white/50 text-xs mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 sm:mt-20 mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-3xl mx-auto px-0">
          {[
            {
              icon: "📖",
              title: "Enroll dengan Kode",
              desc: "Masukkan kode mata pelajaran untuk bergabung sebagai siswa. Dapatkan akses materi dan tugas.",
            },
            {
              icon: "📤",
              title: "Upload & Download",
              desc: "Pengajar upload materi, siswa download. Siswa upload tugas, pengajar beri penilaian.",
            },
            {
              icon: "⏰",
              title: "Tugas Terjadwal",
              desc: "Pengajar atur deadline tugas. Sistem lacak pengumpulan tepat waktu.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 hover:bg-white/10 hover:-translate-y-1 transition-all"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
