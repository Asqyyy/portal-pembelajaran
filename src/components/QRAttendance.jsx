import { useState, useEffect, useRef } from "react";
import QRCodeLib from "qrcode";
import { api } from "../api/client";

export default function QRAttendance({ courseCode, role }) {
  const [qrImage, setQrImage] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(120); // default 120s
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [studentTokenInput, setStudentTokenInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const intervalRef = useRef(null);

  const loadAttendanceRecords = async () => {
    try {
      const data = await api.getAttendance(courseCode);
      setAttendanceRecords(data);
    } catch (err) {
      console.error("Failed to load attendance records:", err);
    }
  };

  useEffect(() => {
    loadAttendanceRecords();
    return () => clearInterval(intervalRef.current);
  }, [courseCode]);

  // Lecturer: Generate QR
  const handleGenerateQR = async () => {
    setMessage("");
    setError("");
    try {
      const res = await api.createAttendanceSession(courseCode, duration);
      const tokenVal = res.session.token;
      
      // Generate QR image from token (hide raw token from plain text screen)
      const qrDataUrl = await QRCodeLib.toDataURL(tokenVal, {
        width: 250,
        margin: 2,
        color: { dark: "#1e3a8a", light: "#ffffff" }
      });

      setQrImage(qrDataUrl);
      setTimeLeft(duration);
      setIsActive(true);

      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsActive(false);
            setQrImage("");
            setMessage("Sesi absensi telah berakhir.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      loadAttendanceRecords();
    } catch (err) {
      setError("Gagal membuat sesi absensi: " + (err.message || err));
    }
  };

  // Student: Submit Token manually
  const handleSubmitToken = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!studentTokenInput.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.recordAttendance(studentTokenInput.trim());
      setMessage(res.message || "Absensi berhasil dicatat!");
      setStudentTokenInput("");
      loadAttendanceRecords();
    } catch (err) {
      setError("Gagal absensi: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const isLecturer = role === "lecturer" || role === "admin";

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <h3 className="font-bold text-gray-800 text-lg text-center mb-2">⏱ PRESENSI / ABSENSI KELAS</h3>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
          ⚠️ {error}
        </div>
      )}

      {message && (
        <div className="p-3 bg-green-50 border border-green-100 text-green-600 rounded-xl text-sm">
          ✅ {message}
        </div>
      )}

      {/* LECTURER VIEW */}
      {isLecturer && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-center space-y-4">
          <h4 className="font-bold text-gray-700 text-sm">MENU DOSEN: GENERATE QR PRESENSI</h4>
          
          <div className="flex justify-center items-center gap-3">
            <label className="text-xs text-gray-500 font-semibold">Durasi aktif (detik):</label>
            <input
              type="number"
              className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-xs font-mono"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10))}
              disabled={isActive}
            />
          </div>

          {!isActive ? (
            <button
              onClick={handleGenerateQR}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition-all"
            >
              🚀 Generate QR Code
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-center p-4 bg-gray-50 rounded-xl inline-block border border-gray-150">
                {qrImage && <img src={qrImage} alt="Presensi QR Code" className="max-w-[200px]" />}
              </div>
              <p className="text-sm font-extrabold text-indigo-600">
                ⏱ Waktu Tersisa: {Math.floor(timeLeft / 60)}m {timeLeft % 60}s
              </p>
              <button
                onClick={() => {
                  clearInterval(intervalRef.current);
                  setIsActive(false);
                  setQrImage("");
                  setMessage("Sesi absensi dihentikan.");
                }}
                className="px-4 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold"
              >
                Hentikan Absensi
              </button>
            </div>
          )}
        </div>
      )}

      {/* STUDENT VIEW */}
      {!isLecturer && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="text-center">
            <span className="text-3xl">📱</span>
            <h4 className="font-bold text-gray-755 text-sm mt-2">MASUKKAN KODE TOKEN ABSENSI</h4>
            <p className="text-[11px] text-gray-400 mt-1">Gunakan kode token presensi yang ditampilkan oleh pengajar di depan kelas.</p>
          </div>

          <form onSubmit={handleSubmitToken} className="space-y-3">
            <input
              type="text"
              placeholder="Masukkan kode token..."
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 text-center tracking-widest font-mono text-lg"
              value={studentTokenInput}
              onChange={(e) => setStudentTokenInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-sm"
            >
              {submitting ? "Mencatat..." : "Submit Presensi"}
            </button>
          </form>
        </div>
      )}

      {/* ATTENDANCE RECORDS LIST */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
        <h4 className="font-bold text-gray-700 text-xs tracking-wide">📋 RIWAYAT PRESENSI KELAS</h4>
        {attendanceRecords.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Belum ada riwayat presensi tercatat.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {attendanceRecords.map((r, i) => (
              <div key={i} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl border border-gray-150 text-xs">
                <span className="font-bold text-gray-750">{r.studentName}</span>
                <span className="text-gray-400">
                  {new Date(r.recordedAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
