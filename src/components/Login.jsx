import { useState } from "react";

export default function Login({ onLogin, onSwitchToRegister }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">🎓</span>
          <h2 className="text-2xl font-bold text-gray-800 mt-3">Masuk</h2>
          <p className="text-gray-500 text-sm mt-1">Portal Pembelajaran</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">
            ❌ {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Masukkan username"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Masukkan password"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? "⏳ Memproses..." : "🔐 Masuk"}
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
