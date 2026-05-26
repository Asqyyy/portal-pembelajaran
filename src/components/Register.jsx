import { useState } from "react";

export default function Register({ onRegister, onSwitchToLogin }) {
  const [step, setStep] = useState(1); // 1: form, 2: verification
  const [form, setForm] = useState({ username: "", password: "", email: "" });
  const [error, setError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [loading, setLoading] = useState(false);

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
    // Simulate sending email verification code
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
    // Success — parent will switch to login
    onSwitchToLogin(form.username);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center px-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl" />
      </div>

      <div className="relative bg-white rounded-2xl shadow-xl p-8 w-full max-w-md page-enter">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl mb-4">
            <span className="text-3xl">🎓</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Daftar Akun</h2>
          <p className="text-gray-500 text-sm mt-1">Portal Pembelajaran</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            step === 1 ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30" : "bg-green-500 text-white"
          }`}>1</div>
          <div className={`w-14 h-0.5 transition-colors ${step === 2 ? "bg-green-500" : "bg-gray-200"}`} />
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            step === 2 ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30" : "bg-gray-200 text-gray-400"
          }`}>2</div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {step === 1 ? (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="Masukkan username"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="contoh@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleSendCode}
              disabled={loading}
              className="w-full mt-6 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-base hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Mengirim kode...
                </span>
              ) : "📧 Kirim Kode Verifikasi"}
            </button>
          </>
        ) : (
          <>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 mb-6 text-center border border-blue-100">
              <p className="text-sm text-blue-700 mb-1">📧 Kode verifikasi telah dikirim ke</p>
              <p className="font-semibold text-blue-800">{form.email}</p>
              <div className="mt-3 bg-white rounded-lg py-3 px-4 border border-blue-200 border-dashed">
                <span className="text-xs text-gray-400">Kode demo:</span>
                <span className="text-2xl font-mono font-bold text-blue-600 tracking-[0.3em] ml-2">{generatedCode}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Masukkan Kode Verifikasi</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                placeholder="000000"
                className="w-full px-4 py-3.5 border border-gray-300 rounded-xl text-center text-2xl font-mono tracking-[0.3em] focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                autoFocus
                maxLength={6}
              />
            </div>

            <button
              onClick={handleVerify}
              className="w-full mt-6 py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold text-base hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              ✅ Verifikasi & Daftar
            </button>

            <button
              onClick={() => setStep(1)}
              className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Kembali ke form
            </button>
          </>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Sudah punya akun?{" "}
          <button onClick={() => onSwitchToLogin()} className="text-purple-600 font-semibold hover:underline">
            Masuk
          </button>
        </p>
      </div>
    </div>
  );
}
