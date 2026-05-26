import { useState } from "react";

export default function Dashboard({ setCurrentPage, role, setRole, user, onLogout }) {
  const icons = ["📐", "🔬", "📖", "💡", "🧬", "🌍", "🧮", "⚛️"];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="dashboard-bg">
      {/* Floating background icons */}
      <div className="floating-icons">
        {icons.map((icon, i) => (
          <span key={i} className="floating-icon">{icon}</span>
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ═══════════════ NAVBAR ═══════════════ */}
        <nav className="dashboard-nav">
          {/* Logo */}
          <button
            onClick={() => setCurrentPage("dashboard")}
            className="dashboard-nav-logo"
            id="nav-logo-btn"
          >
            <span className="dashboard-nav-logo-icon">🎓</span>
            <span className="dashboard-nav-logo-text">
              Portal<span className="text-purple-400">Pembelajaran</span>
            </span>
          </button>

          {/* Nav Links (desktop) */}
          <div className="dashboard-nav-links">
            <button
              onClick={() => setCurrentPage("dashboard")}
              className="dashboard-nav-link dashboard-nav-link-active"
              id="nav-home-btn"
            >
              <span>🏠</span> Beranda
            </button>
            <button
              onClick={() => setCurrentPage("courses")}
              className="dashboard-nav-link"
              id="nav-courses-btn"
            >
              <span>📚</span> Kursus Saya
            </button>
          </div>

          {/* Right side */}
          <div className="dashboard-nav-right">
            {user ? (
              <>
                {/* Role badge */}
                <div className="dashboard-role-badge">
                  <span>{role === "lecturer" ? "👨‍🏫" : "👨‍🎓"}</span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="dashboard-role-select"
                    id="role-select"
                  >
                    <option value="student">Siswa</option>
                    <option value="lecturer">Pengajar</option>
                  </select>
                </div>

                {/* User avatar + logout */}
                <div className="dashboard-user-group">
                  <div className="dashboard-avatar" title={user.username}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="dashboard-user-info">
                    <span className="dashboard-user-name">{user.username}</span>
                    <button
                      onClick={onLogout}
                      className="dashboard-logout-btn"
                      id="nav-logout-btn"
                    >
                      Keluar
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <button
                onClick={() => setCurrentPage("login")}
                className="dashboard-nav-login-btn"
                id="nav-login-btn"
              >
                <span>🔐</span> Masuk
              </button>
            )}
          </div>
        </nav>

        {/* ═══════════════ HERO ═══════════════ */}
        <div className="dashboard-hero">
          {/* Left: Text */}
          <div className="dashboard-hero-text">
            <div className="dashboard-hero-badge">
              {user
                ? `👋 Halo, ${user.username}!`
                : "🎓 Platform Belajar Terbaik"}
            </div>

            <h2 className="dashboard-hero-title">
              Platform{" "}
              <span className="dashboard-hero-gradient">Belajar</span>
              <br />
              <span className="dashboard-hero-sub">untuk MA &amp; SMA</span>
            </h2>

            <p className="dashboard-hero-desc">
              Temukan mata pelajaranmu, akses materi kapan saja, kumpulkan tugas
              tepat waktu, dan raih prestasi terbaik bersama pengajar terpilih.
            </p>

            <div className="dashboard-hero-actions">
              <button
                onClick={() => setCurrentPage("courses")}
                className="dashboard-btn-primary"
                id="hero-explore-btn"
              >
                <span>📖</span> Jelajahi Kursus
              </button>

              {user ? (
                <button
                  onClick={() => setCurrentPage("courses")}
                  className="dashboard-btn-secondary"
                  id="hero-secondary-btn"
                >
                  <span>{role === "lecturer" ? "🎓" : "📝"}</span>
                  {role === "lecturer" ? "Kelola Kelas" : "Tugas Saya"}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentPage("register")}
                  className="dashboard-btn-ghost"
                  id="hero-register-btn"
                >
                  <span>📝</span> Daftar Gratis
                </button>
              )}
            </div>
          </div>

          {/* Right: Stats */}
          <div className="dashboard-stats-grid">
            {[
              { icon: "📚", value: "21+", label: "Mata Pelajaran", gradient: "stat-blue" },
              { icon: "👨‍🏫", value: "Siap", label: "Untuk Pengajar", gradient: "stat-purple" },
              { icon: "🎯", value: "Mandiri", label: "Belajar Fleksibel", gradient: "stat-pink" },
              { icon: "🏛️", value: "MA/SMA", label: "Setara Aliyah", gradient: "stat-orange" },
            ].map((stat, i) => (
              <div key={i} className={`dashboard-stat-card ${stat.gradient}`}>
                <div className="dashboard-stat-icon">{stat.icon}</div>
                <div className="dashboard-stat-value">{stat.value}</div>
                <div className="dashboard-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════ FEATURES ═══════════════ */}
        <div className="dashboard-features">
          {[
            {
              icon: "📖",
              title: "Enroll dengan Kode",
              desc: "Masukkan kode mata pelajaran untuk bergabung sebagai siswa dan dapatkan akses materi lengkap.",
              color: "feature-blue",
            },
            {
              icon: "📤",
              title: "Upload & Download",
              desc: "Pengajar upload materi, siswa download. Siswa upload tugas, pengajar beri penilaian.",
              color: "feature-purple",
            },
            {
              icon: "⏰",
              title: "Tugas Terjadwal",
              desc: "Pengajar atur deadline tugas. Sistem otomatis lacak pengumpulan tepat waktu.",
              color: "feature-pink",
            },
          ].map((feature, i) => (
            <div key={i} className={`dashboard-feature-card ${feature.color}`}>
              <div className="dashboard-feature-icon-wrap">
                <span className="dashboard-feature-icon">{feature.icon}</span>
              </div>
              <h3 className="dashboard-feature-title">{feature.title}</h3>
              <p className="dashboard-feature-desc">{feature.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
