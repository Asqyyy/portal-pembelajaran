import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f0f4f8] flex flex-col justify-center items-center p-6 text-center page-enter">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-md border border-gray-100 space-y-6">
        <span className="text-7xl block animate-bounce">🔍</span>
        <h2 className="text-3xl font-extrabold text-gray-900">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-500 text-sm">
          Maaf, halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan ke lokasi lain.
        </p>
        <Link
          to="/"
          className="block w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
