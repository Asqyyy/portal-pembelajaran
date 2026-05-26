import { useState } from "react";

export default function Register({ onRegister, onSwitchToLogin }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ username: "", password: "", email: "" });
  const [error, setError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSendCode = () => {
    setError("");
    if (!form.username || !form.password || !form.email) {
      setError("Semua field harus diisi.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    if (!form.email.includes("@")) {
      setError("Format email tidak valid.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setStep(2);
      setLoading(false);
    }, 1500);
  };

  const handleVerify = () => {
    setError("");
    if (verificationCode !== generatedCode) {
      setError("Kode verifikasi salah. Coba lagi.");
      return;
    }
    const result = onRegister(form.username, form.password, form.email);
    if (!result.success) {
      setError(result.error);
      return;
    }
    onSwitchToLogin(form.username);
  };

  return (
    <div className="auth-page">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />

      <div className="auth-card auth-card-register">
        {/* Logo & title */}
        <div className="auth-header">
          <div className="auth-logo">📝</div>
          <h1 className="auth-title">Buat Akun Baru</h1>
          <p className="auth-subtitle">Portal Pembelajaran — MA/SMA</p>
        </div>

        {/* Step Indicator */}
        <div className="auth-steps">
          <div className={`auth-step ${step >= 1 ? "auth-step-active" : ""} ${step > 1 ? "auth-step-done" : ""}`}>
            <div className="auth-step-circle">
              {step > 1 ? "✓" : "1"}
            </div>
            <span className="auth-step-label">Data Diri</span>
          </div>
          <div className={`auth-step-line ${step > 1 ? "auth-step-line-done" : ""}`} />
          <div className={`auth-step ${step === 2 ? "auth-step-active" : ""}`}>
            <div className="auth-step-circle">2</div>
            <span className="auth-step-label">Verifikasi</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="auth-alert auth-alert-error">
            <span className="auth-alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <>
            <div className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Username</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">👤</span>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="Pilih username unikmu"
                    className="auth-input"
                    id="reg-username"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Email</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">📧</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="contoh@sekolah.sch.id"
                    className="auth-input"
                    id="reg-email"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Password</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">🔑</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Minimal 6 karakter"
                    className="auth-input auth-input-password"
                    id="reg-password"
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
                {form.password.length > 0 && (
                  <div className="auth-password-strength">
                    <div
                      className="auth-password-bar"
                      style={{
                        width: `${Math.min(100, (form.password.length / 12) * 100)}%`,
                        background: form.password.length < 6 ? "#ef4444" : form.password.length < 10 ? "#f59e0b" : "#10b981"
                      }}
                    />
                    <span className="auth-password-label">
                      {form.password.length < 6 ? "Terlalu pendek" : form.password.length < 10 ? "Cukup" : "Kuat"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              id="send-code-btn"
              onClick={handleSendCode}
              disabled={loading}
              className="auth-btn-primary"
            >
              {loading ? (
                <><span className="auth-spinner" /> Mengirim kode...</>
              ) : (
                <><span>📧</span> Kirim Kode Verifikasi</>
              )}
            </button>
          </>
        ) : (
          <>
            {/* Verification step */}
            <div className="auth-verify-info">
              <div className="auth-verify-icon">📬</div>
              <p className="auth-verify-text">Kode dikirim ke</p>
              <p className="auth-verify-email">{form.email}</p>
              <div className="auth-verify-demo">
                <span className="auth-verify-demo-label">Kode demo:</span>
                <span className="auth-verify-demo-code">{generatedCode}</span>
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" style={{ textAlign: "center", display: "block" }}>
                Masukkan 6-digit kode verifikasi
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="000000"
                className="auth-otp-input"
                autoFocus
                maxLength={6}
                id="otp-input"
              />
            </div>

            <button
              id="verify-btn"
              onClick={handleVerify}
              className="auth-btn-success"
            >
              <span>✅</span> Verifikasi &amp; Buat Akun
            </button>

            <button
              onClick={() => { setStep(1); setVerificationCode(""); setError(""); }}
              className="auth-btn-ghost"
            >
              ← Kembali isi data
            </button>
          </>
        )}

        <div className="auth-divider">
          <span className="auth-divider-line" />
          <span className="auth-divider-text">sudah punya akun?</span>
          <span className="auth-divider-line" />
        </div>

        <p className="auth-switch">
          <button id="switch-to-login-btn" onClick={() => onSwitchToLogin()} className="auth-link">
            ← Masuk ke akun yang ada
          </button>
        </p>
      </div>
    </div>
  );
}
