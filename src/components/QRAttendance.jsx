import { useState, useEffect, useRef } from "react";
import QRCodeLib from "qrcode";
import { api } from "../api/client";

export default function QRAttendance({ courseCode, role }) {
  const [qrData, setQrData] = useState(null);
  const [qrImage, setQrImage] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(120);
  const [message, setMessage] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadAttendanceRecords();
    return () => clearInterval(intervalRef.current);
  }, [courseCode]);

  const loadAttendanceRecords = async () => {
    try {
      const data = await api.getAttendance(courseCode);
      setAttendanceRecords(Array.isArray(data) ? data : (data.records || []));
    } catch {
      // Fallback to localStorage
      const key = 'attendance_' + courseCode;
      try {
        setAttendanceRecords(JSON.parse(localStorage.getItem(key) || "[]"));
      } catch { setAttendanceRecords([]); }
    }
  };

  const generateQR = async (data) => {
    try {
      const url = await QRCodeLib.toDataURL(JSON.stringify(data), {
        width: 280,
        margin: 2,
        color: { dark: "#1e3a5f", light: "#ffffff" },
      });
      setQrImage(url);
    } catch (e) {
      console.error("QR generation error:", e);
    }
  };

  const startQRSession = () => {
    const token = Math.random().toString(36).substring(2, 10);
    const now = Date.now();
    const data = {
      courseCode,
      token,
      generatedAt: now,
      expiresAt: now + duration * 1000,
    };
    setQrData(data);
    setIsActive(true);
    setTimeLeft(duration);
    setMessage("");
    generateQR(data);

    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const newToken = Math.random().toString(36).substring(2, 10);
          const newNow = Date.now();
          const newData = {
            courseCode,
            token: newToken,
            generatedAt: newNow,
            expiresAt: newNow + duration * 1000,
          };
          setQrData(newData);
          generateQR(newData);
          return duration;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopQRSession = () => {
    clearInterval(intervalRef.current);
    setIsActive(false);
    setQrImage("");
    setQrData(null);
    setTimeLeft(0);
  };

  const handleScan = async () => {
    if (!qrData) return;
    setLoading(true);

    try {
      const result = await api.recordAttendance(courseCode, qrData.token);
      if (result.success !== false) {
        setMessage("✅ Absen berhasil! Kehadiran tercatat.");
        await loadAttendanceRecords();
      } else {
        setMessage('⚠️ ' + (result.error || 'Gagal absen.'));
      }
    } catch (err) {
      // Fallback: local attendance
      const key = 'attendance_' + courseCode;
      const records = JSON.parse(localStorage.getItem(key) || "[]");
      if (records.find((r) => r.token === qrData.token && r.student === "Kamu")) {
        setMessage("⚠️ Kamu sudah absen untuk sesi ini.");
      } else {
        records.push({
          student: "Kamu",
          token: qrData.token,
          time: new Date().toLocaleString("id-ID"),
          timestamp: Date.now(),
        });
        localStorage.setItem(key, JSON.stringify(records));
        setAttendanceRecords(records);
        setMessage("✅ Absen berhasil! (local)");
      }
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const clearRecords = () => {
    localStorage.removeItem('attendance_' + courseCode);
    setAttendanceRecords([]);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m + ':' + String(s).padStart(2, "0");
  };

  return (
    <div>
      {role === "lecturer" && (
        <div className="bg-indigo-50 rounded-xl p-6 mb-6">
          <h4 className="font-bold text-indigo-800 text-lg mb-3">📱 QR Code Absensi</h4>
          <p className="text-sm text-indigo-600 mb-4">
            Aktifkan QR Code untuk sesi absensi. QR akan berganti otomatis setiap {duration} detik untuk mencegah kecurangan.
          </p>

          {!isActive ? (
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Durasi per QR (detik)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:outline-none"
                >
                  <option value={30}>30 detik</option>
                  <option value={60}>60 detik</option>
                  <option value={120}>2 menit</option>
                  <option value={300}>5 menit</option>
                </select>
              </div>
              <button
                onClick={startQRSession}
                className="px-6 py-2.5 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-colors"
              >
                ▶ Mulai Absensi
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Sesi Aktif
              </div>
              <span className="text-sm text-gray-600">
                QR berganti dalam: <strong className="text-indigo-700 font-mono">{formatTime(timeLeft)}</strong>
              </span>
              <button
                onClick={stopQRSession}
                className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
              >
                ⏹ Hentikan
              </button>
            </div>
          )}

          {qrImage && (
            <div className="mt-4 bg-white rounded-xl p-4 inline-block shadow-sm">
              <img src={qrImage} alt="QR Absensi" className="w-[280px] h-[280px]" />
              <p className="text-center text-xs text-gray-400 mt-2 font-mono">
                Token: {qrData?.token}
              </p>
            </div>
          )}
        </div>
      )}

      {role === "student" && isActive && (
        <div className="bg-blue-50 rounded-xl p-6 mb-6 text-center">
          <h4 className="font-bold text-blue-800 text-lg mb-3">📱 Absensi QR</h4>
          <p className="text-sm text-blue-600 mb-4">
            Scan QR Code yang ditampilkan pengajar untuk mencatat kehadiran.
          </p>
          {qrImage && (
            <div className="bg-white rounded-xl p-4 inline-block shadow-sm mb-4">
              <img src={qrImage} alt="QR Absensi" className="w-[200px] h-[200px]" />
            </div>
          )}
          <div>
            <button
              onClick={handleScan}
              disabled={loading}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? "⏳ Memproses..." : "📸 Scan / Tap untuk Absen"}
            </button>
            <p className="text-xs text-gray-400 mt-2">QR berganti otomatis — pastikan scan QR terbaru</p>
          </div>
          {message && (
            <div className={'mt-4 px-4 py-2 rounded-lg text-sm font-medium ' + (
              message.includes("berhasil") ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
            )}>
              {message}
            </div>
          )}
        </div>
      )}

      {role === "student" && !isActive && (
        <div className="bg-gray-50 rounded-xl p-6 mb-6 text-center">
          <span className="text-4xl">📱</span>
          <p className="text-sm text-gray-500 mt-2">Belum ada sesi absensi aktif. Tunggu pengajar memulai absensi.</p>
        </div>
      )}

      {attendanceRecords.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-700 text-sm">📋 Riwayat Kehadiran ({attendanceRecords.length})</h4>
            {role === "lecturer" && (
              <button onClick={clearRecords} className="text-xs text-red-400 hover:text-red-600">
                Hapus Semua
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {attendanceRecords.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 px-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span className="font-medium text-gray-700">{r.student}</span>
                </div>
                <span className="text-xs text-gray-400">{r.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
