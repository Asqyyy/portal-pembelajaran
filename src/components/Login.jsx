import { useState } from "react";

export default function Login({ onLogin, onSwitchToRegister }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    setError("");
    if (!form.username || !form.password) {
      setError("Username dan password harus diisi.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const result = onLogin(form.username, form.password);
      if (!result.success) {
        setError(result.error);
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="auth-page">
      {/* Animated background blobs */}
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />

      <div className="auth-card">
        {/* Logo & title */}
        <div className="auth-header">
          <div className="auth-logo">🎓</div>
          <h1 className="auth-title">Selamat Datang</h1>
          <p className="auth-subtitle">Masuk ke Portal Pembelajaran</p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="auth-alert auth-alert-error">
            <span className="auth-alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <div className="auth-form">
          {/* Username field */}
          <div className="auth-field">
            <label className="auth-label">Username</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">👤</span>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Masukkan username kamu"
                className="auth-input"
                autoFocus
                id="login-username"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔑</span>
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Masukkan password kamu"
                className="auth-input auth-input-password"
                id="login-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="auth-eye-btn"
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <button
          id="login-submit-btn"
          onClick={handleSubmit}
          disabled={loading}
          className="auth-btn-primary"
        >
          {loading ? (
            <><span className="auth-spinner" /> Memproses...</>
          ) : (
            <><span>🚀</span> Masuk Sekarang</>
          )}
        </button>

        {/* Divider */}
        <div className="auth-divider">
          <span className="auth-divider-line" />
          <span className="auth-divider-text">atau</span>
          <span className="auth-divider-line" />
        </div>

        {/* Switch to register */}
        <p className="auth-switch">
          Belum punya akun?{" "}
          <button id="switch-to-register-btn" onClick={onSwitchToRegister} className="auth-link">
            Daftar Sekarang →
          </button>
        </p>
      </div>
    </div>
  );
}
