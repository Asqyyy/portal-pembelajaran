import { useState, useEffect, useRef } from "react";
import QRCodeLib from "qrcode";

const SESSION_KEY = (code) => `qr_session_${code}`;

export default function QRAttendance({ courseCode, role }) {
  const [qrImage,   setQrImage]   = useState("");
  const [timeLeft,  setTimeLeft]  = useState(0);
  const [isActive,  setIsActive]  = useState(false);
  const [session,   setSession]   = useState(null);   // shared via localStorage
  const [duration,  setDuration]  = useState(120);
  const [message,   setMessage]   = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const intervalRef  = useRef(null);
  const pollRef      = useRef(null);   // for student polling

  // ── Init ──────────────────────────────────────────────
  useEffect(() => {
    loadRecords();
    // Restore active session if lecturer had one
    const saved = readSession();
    if (saved && Date.now() < saved.expiresAt) {
      setSession(saved);
      setIsActive(true);
      setTimeLeft(Math.round((saved.expiresAt - Date.now()) / 1000));
      generateQR(saved);
    }
    return () => { clearInterval(intervalRef.current); clearInterval(pollRef.current); };
  }, [courseCode]);

  // ── Student: poll localStorage every 2 s for active session ──
  useEffect(() => {
    if (role !== "student") return;
    const poll = () => {
      const s = readSession();
      if (s && Date.now() < s.expiresAt) {
        if (!session || s.token !== session.token) {
          setSession(s);
          setIsActive(true);
          generateQR(s);
        }
      } else {
        setIsActive(false);
        setSession(null);
        setQrImage("");
      }
    };
    pollRef.current = setInterval(poll, 1500);
    poll(); // run immediately
    return () => clearInterval(pollRef.current);
  }, [role, courseCode, session]);

  // ── Helpers ───────────────────────────────────────────
  const readSession = () => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY(courseCode))); }
    catch { return null; }
  };

  const writeSession = (data) => {
    localStorage.setItem(SESSION_KEY(courseCode), JSON.stringify(data));
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY(courseCode));
  };

  const loadRecords = () => {
    const r = JSON.parse(localStorage.getItem(`attendance_${courseCode}`) || "[]");
    setAttendanceRecords(r);
  };

  const generateQR = async (data) => {
    try {
      const url = await QRCodeLib.toDataURL(JSON.stringify(data), {
        width: 240, margin: 2,
        color: { dark: "#1e3a5f", light: "#ffffff" },
      });
      setQrImage(url);
    } catch (e) { console.error("QR error:", e); }
  };

  const makeNewToken = (dur) => {
    const token = Math.random().toString(36).substring(2, 10);
    const now   = Date.now();
    return { courseCode, token, generatedAt: now, expiresAt: now + dur * 1000 };
  };

  // ── Lecturer: start ───────────────────────────────────
  const startQRSession = () => {
    const data = makeNewToken(duration);
    setSession(data); setIsActive(true);
    setTimeLeft(duration); setMessage("");
    writeSession(data);
    generateQR(data);

    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const newData = makeNewToken(duration);
          setSession(newData);
          writeSession(newData);
          generateQR(newData);
          return duration;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Lecturer: stop ────────────────────────────────────
  const stopQRSession = () => {
    clearInterval(intervalRef.current);
    clearSession();
    setIsActive(false); setQrImage(""); setSession(null); setTimeLeft(0);
  };

  // ── Student: scan / tap ───────────────────────────────
  const handleScan = () => {
    if (!session) return;
    const key     = `attendance_${courseCode}`;
    const records = JSON.parse(localStorage.getItem(key) || "[]");
    // Check if already scanned THIS token
    if (records.find((r) => r.token === session.token && r.student === "Kamu")) {
      setMessage("warn:Kamu sudah absen untuk sesi ini.");
    } else {
      records.push({
        student: "Kamu", token: session.token,
        time: new Date().toLocaleString("id-ID"), timestamp: Date.now(),
      });
      localStorage.setItem(key, JSON.stringify(records));
      setMessage("ok:Absen berhasil! Kehadiran tercatat. ✅");
      loadRecords();
    }
    setTimeout(() => setMessage(""), 4000);
  };

  const clearRecords = () => {
    localStorage.removeItem(`attendance_${courseCode}`);
    setAttendanceRecords([]);
  };

  const formatTime = (secs) =>
    `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

  const msgType    = message.startsWith("ok:") ? "success" : "warn";
  const msgContent = message.replace(/^(ok:|warn:)/, "");

  // ── Render ────────────────────────────────────────────
  return (
    <div>
      {/* ═══════════ LECTURER ═══════════ */}
      {role === "lecturer" && (
        <div className="qr-lecturer-panel">
          <h4 className="qr-panel-title">📱 QR Code Absensi</h4>
          <p className="qr-panel-sub">
            QR berganti otomatis setiap <strong>{duration} detik</strong>. Siswa cukup buka tab <em>Absensi QR</em> dan tap tombol Absen.
          </p>

          <div className="qr-controls">
            {!isActive ? (
              <>
                <div>
                  <label className="qr-duration-label">Durasi per QR</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="qr-duration-select"
                    id="qr-duration-select"
                  >
                    <option value={30}>30 detik</option>
                    <option value={60}>1 menit</option>
                    <option value={120}>2 menit</option>
                    <option value={300}>5 menit</option>
                  </select>
                </div>
                <button onClick={startQRSession} className="qr-start-btn" id="start-qr-btn">
                  ▶ Mulai Absensi
                </button>
              </>
            ) : (
              <>
                <div className="qr-active-indicator">
                  <span className="qr-active-dot" />
                  Sesi Aktif
                </div>
                <span className="qr-timer">
                  Berganti dalam: <strong>{formatTime(timeLeft)}</strong>
                </span>
                <button onClick={stopQRSession} className="qr-stop-btn" id="stop-qr-btn">
                  ⏹ Hentikan
                </button>
              </>
            )}
          </div>

          {qrImage && (
            <div className="qr-image-wrap">
              <img src={qrImage} alt="QR Absensi" width={240} height={240} />
              <p className="qr-token">Token: {session?.token}</p>
            </div>
          )}

          {!isActive && (
            <p style={{ marginTop: 12, fontSize: "0.78rem", color: "#94a3b8" }}>
              ℹ️ Setelah memulai, siswa yang membuka tab Absensi QR bisa langsung tap Absen.
            </p>
          )}
        </div>
      )}

      {/* ═══════════ STUDENT — active ═══════════ */}
      {role === "student" && isActive && (
        <div className="qr-student-panel">
          <h4 className="qr-student-title">📱 Absensi QR Aktif</h4>
          <p className="qr-student-sub">Pengajar sedang membuka sesi absensi. Tap tombol di bawah untuk mencatat kehadiran.</p>

          {qrImage && (
            <div style={{ display: "inline-block", background: "white", borderRadius: 12, padding: 12, marginBottom: 16, border: "2px solid #bfdbfe" }}>
              <img src={qrImage} alt="QR" width={180} height={180} />
            </div>
          )}

          <div>
            <button onClick={handleScan} className="qr-scan-btn" id="scan-qr-btn">
              📸 Tap untuk Absen
            </button>
            <p className="qr-scan-hint">QR berganti otomatis tiap sesi untuk mencegah kecurangan</p>
            {message && (
              <div className={`qr-message ${msgType === "success" ? "qr-message-success" : "qr-message-warn"}`}>
                {msgContent}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ STUDENT — idle ═══════════ */}
      {role === "student" && !isActive && (
        <div className="qr-idle-panel">
          <div className="qr-idle-icon">📱</div>
          <p className="qr-idle-text">Belum ada sesi absensi aktif.</p>
          <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 4 }}>
            Pengajar perlu membuka tab <strong>Absensi QR</strong> dan menekan <strong>Mulai Absensi</strong>.
          </p>
        </div>
      )}

      {/* ═══════════ RECORDS ═══════════ */}
      {attendanceRecords.length > 0 && (
        <div className="qr-records">
          <div className="qr-records-header">
            <span className="qr-records-title">📋 Riwayat Kehadiran ({attendanceRecords.length} orang)</span>
            {role === "lecturer" && (
              <button onClick={clearRecords} className="qr-clear-btn" id="clear-records-btn">
                🗑 Hapus Semua
              </button>
            )}
          </div>
          <div className="qr-records-list">
            {attendanceRecords.map((r, i) => (
              <div key={i} className="qr-record-item">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#10b981" }}>✅</span>
                  <span className="qr-record-name">{r.student}</span>
                </div>
                <span className="qr-record-time">{r.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
