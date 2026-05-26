import { useState, useEffect } from "react";
import { courses } from "../data/mockData";

const FACULTY_COLORS = {
  MIPA:   { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-400"   },
  Bahasa: { bg: "bg-emerald-50",text: "text-emerald-700", dot: "bg-emerald-400" },
  IPS:    { bg: "bg-orange-50", text: "text-orange-700",  dot: "bg-orange-400"  },
  Umum:   { bg: "bg-slate-50",  text: "text-slate-700",   dot: "bg-slate-400"   },
  Agama:  { bg: "bg-purple-50", text: "text-purple-700",  dot: "bg-purple-400"  },
};

export default function CourseList({ setCurrentPage, setSelectedCourse, role }) {
  const [activeTab, setActiveTab] = useState("learning");
  const [enrolledCourses, setEnrolledCourses] = useState(() => {
    try { return JSON.parse(localStorage.getItem("enrolledCourses") || "[]"); }
    catch { return []; }
  });
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollCode, setEnrollCode] = useState("");
  const [enrollError, setEnrollError] = useState("");
  const [enrollSuccess, setEnrollSuccess] = useState("");

  useEffect(() => {
    localStorage.setItem("enrolledCourses", JSON.stringify(enrolledCourses));
  }, [enrolledCourses]);

  const handleEnroll = () => {
    setEnrollError(""); setEnrollSuccess("");
    const code = enrollCode.trim().toUpperCase();
    if (!code) { setEnrollError("Masukkan kode mata pelajaran terlebih dahulu."); return; }
    const course = courses.find((c) => c.courseCode === code);
    if (!course) { setEnrollError("Kode tidak ditemukan. Periksa kembali."); return; }
    if (enrolledCourses.some((c) => c.id === course.id && c.category === activeTab)) {
      setEnrollError("Kamu sudah terdaftar di mata pelajaran ini."); return;
    }
    setEnrolledCourses([...enrolledCourses, { ...course, category: activeTab }]);
    setEnrollSuccess(`Berhasil mendaftar ke "${course.courseName}"!`);
    setEnrollCode("");
  };

  const displayedCourses = enrolledCourses.filter((c) => c.category === activeTab);
  const learningCount = enrolledCourses.filter((c) => c.category === "learning").length;
  const teachingCount = enrolledCourses.filter((c) => c.category === "teaching").length;

  const openEnrollModal = () => {
    setEnrollError(""); setEnrollSuccess(""); setEnrollCode("");
    setShowEnrollModal(true);
  };

  return (
    <div className="min-h-screen" style={{ background: "#f0f4f8" }}>
      {/* Hero Header */}
      <div className="courselist-header">
        <div className="courselist-header-inner">
          <div>
            <div className="courselist-header-badge">
              {activeTab === "learning" ? "👨‍🎓 Mode Siswa" : "👨‍🏫 Mode Pengajar"}
            </div>
            <h2 className="courselist-header-title">
              {activeTab === "learning" ? "Kursus Saya" : "Kelas yang Saya Ajar"}
            </h2>
            <p className="courselist-header-sub">
              {activeTab === "learning"
                ? `${learningCount} mata pelajaran aktif`
                : `${teachingCount} kelas yang diampu`}
            </p>
          </div>
          <button
            id="enroll-btn"
            onClick={openEnrollModal}
            className="courselist-enroll-btn"
          >
            <span className="courselist-enroll-icon">＋</span>
            Enroll Kursus
          </button>
        </div>
      </div>

      <div className="courselist-body">
        {/* Tabs */}
        <div className="courselist-tabs-wrap">
          <div className="courselist-tabs">
            {[
              { key: "learning", icon: "📖", label: "Sedang Dipelajari", count: learningCount, color: "tab-blue" },
              { key: "teaching", icon: "🎓", label: "Sedang Diajar",     count: teachingCount, color: "tab-purple" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`courselist-tab ${activeTab === tab.key ? `courselist-tab-active ${tab.color}` : ""}`}
                id={`tab-${tab.key}`}
              >
                <span className="courselist-tab-icon">{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`courselist-tab-count ${activeTab === tab.key ? "courselist-tab-count-active" : ""}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {displayedCourses.length === 0 ? (
          <div className="courselist-empty">
            <div className="courselist-empty-icon">📭</div>
            <h3 className="courselist-empty-title">Belum ada kursus</h3>
            <p className="courselist-empty-desc">
              {activeTab === "learning"
                ? "Kamu belum mendaftar ke mata pelajaran manapun."
                : "Kamu belum terdaftar sebagai pengajar di kelas manapun."}
              <br />Klik tombol <strong>Enroll Kursus</strong> untuk mulai!
            </p>
            <button
              onClick={openEnrollModal}
              className="courselist-empty-btn"
              id="enroll-empty-btn"
            >
              ＋ Enroll Kursus Sekarang
            </button>
          </div>
        ) : (
          <div className="courselist-grid">
            {displayedCourses.map((course, idx) => {
              const fc = FACULTY_COLORS[course.faculty] || FACULTY_COLORS["Umum"];
              return (
                <div key={`${course.id}-${course.category}`} className="course-card">
                  {/* Card top */}
                  <div className="course-card-top">
                    <div className="course-card-index">
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <span className={`course-card-code`}>
                      {course.courseCode}
                    </span>
                  </div>

                  {/* Course name */}
                  <h3 className="course-card-name">{course.courseName}</h3>

                  {/* Faculty badge */}
                  <div className="course-card-meta">
                    <span className={`course-card-faculty ${fc.bg} ${fc.text}`}>
                      <span className={`course-card-dot ${fc.dot}`} />
                      {course.faculty}
                    </span>
                  </div>

                  {/* Lecturers */}
                  {course.lecturers && course.lecturers.length > 0 && (
                    <div className="course-card-lecturers">
                      {course.lecturers.map((lec, i) => (
                        <span key={i} className="badge badge-lecturer">{lec}</span>
                      ))}
                    </div>
                  )}

                  {/* Action */}
                  <button
                    onClick={() => { setSelectedCourse({ ...course }); setCurrentPage("courseDetail"); }}
                    className="course-card-btn"
                    id={`view-course-${course.id}`}
                  >
                    Lihat Detail <span>→</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="modal-overlay" onClick={() => setShowEnrollModal(false)}>
          <div className="enroll-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className="enroll-modal-header">
              <div>
                <h3 className="enroll-modal-title">Enroll Kursus</h3>
                <p className="enroll-modal-sub">
                  Masuk sebagai{" "}
                  <strong>{activeTab === "learning" ? "Siswa" : "Pengajar"}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowEnrollModal(false)}
                className="enroll-modal-close"
                id="enroll-modal-close"
              >
                ✕
              </button>
            </div>

            {/* Input */}
            <div className="enroll-modal-body">
              <label className="enroll-modal-label">Kode Mata Pelajaran</label>
              <div className="enroll-modal-input-wrap">
                <span className="enroll-modal-input-icon">🔍</span>
                <input
                  type="text"
                  value={enrollCode}
                  onChange={(e) => setEnrollCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleEnroll()}
                  placeholder="Contoh: MAT-XII"
                  className="enroll-modal-input"
                  autoFocus
                  id="enroll-code-input"
                />
              </div>

              {enrollError && (
                <div className="enroll-alert enroll-alert-error">⚠️ {enrollError}</div>
              )}
              {enrollSuccess && (
                <div className="enroll-alert enroll-alert-success">✅ {enrollSuccess}</div>
              )}

              <button
                onClick={handleEnroll}
                className="enroll-modal-submit"
                id="enroll-submit-btn"
              >
                Daftar Sekarang
              </button>

              {/* Quick codes */}
              <div className="enroll-quick">
                <p className="enroll-quick-label">Kode cepat:</p>
                <div className="enroll-quick-codes">
                  {courses.slice(0, 12).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setEnrollCode(c.courseCode)}
                      className={`enroll-quick-code ${enrollCode === c.courseCode ? "enroll-quick-code-active" : ""}`}
                    >
                      {c.courseCode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
