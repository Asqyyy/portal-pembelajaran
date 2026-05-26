import { useState } from "react";

export default function Login({ onLogin, onSwitchToRegister }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!form.username || !form.password) {
      setError("Username dan password harus diisi.");
      return;
    }
    setLoading(true);
    try {
      const result = await onLogin(form.username, form.password);
      if (!result.success) {
        setError(result.error);
      }
    } catch (e) {
      setError(e.error || e.message || "Login gagal. Periksa koneksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
      </div>

      <div className="relative bg-white rounded-2xl shadow-xl p-8 w-full max-w-md page-enter">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl mb-4">
            <span className="text-3xl">🎓</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Masuk</h2>
          <p className="text-gray-500 text-sm mt-1">Portal Pembelajaran</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Masukkan username"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Masukkan password"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-6 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-base hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Memproses...
            </span>
          ) : "🔐 Masuk"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Belum punya akun?{" "}
          <button onClick={onSwitchToRegister} className="text-purple-600 font-semibold hover:underline">
            Daftar
          </button>
        </p>
      </div>
    </div>
  );
}
