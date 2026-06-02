import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function CourseList({ role, user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("learning");
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollCode, setEnrollCode] = useState("");
  const [enrollError, setEnrollError] = useState("");
  const [enrollSuccess, setEnrollSuccess] = useState("");

  const loadCourses = () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError("");
    
    // Fetch all courses (to match codes) and user enrollments
    Promise.all([
      api.getCourses(),
      api.getCourse('/user/enrollments').catch(() => []) // fallback or secondary endpoint
    ])
      .then(([allData, userEnrollments]) => {
        // If the backend has enrollment filter inside getCourses or separate
        // Let's check format: getCourses returns all courses with `enrolled` key, or list
        const courses = Array.isArray(allData) ? allData : [];
        setAllCourses(courses);
        
        // Find enrolled ones
        const enrolled = courses.filter(c => c.enrolled);
        setEnrolledCourses(enrolled);
      })
      .catch((err) => {
        console.error("Failed to fetch courses from API:", err);
        setError("Gagal memuat kursus dari server: " + (err.message || err));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCourses();
  }, [user]);

  const handleEnroll = async () => {
    setEnrollError("");
    setEnrollSuccess("");
    const code = enrollCode.trim().toUpperCase();
    if (!code) {
      setEnrollError("Masukkan kode mata pelajaran terlebih dahulu.");
      return;
    }

    const course = allCourses.find((c) => c.courseCode === code);
    if (!course) {
      setEnrollError("Kode mata pelajaran tidak ditemukan. Periksa kembali kode yang dimasukkan.");
      return;
    }

    if (enrolledCourses.some((c) => c.courseCode === code && c.category === activeTab)) {
      setEnrollError("Kamu sudah terdaftar di mata pelajaran ini.");
      return;
    }

    try {
      await api.enrollCourse(course.id, activeTab);
      setEnrollSuccess('Berhasil mendaftar ke "' + course.courseName + '"!');
      setEnrollCode("");
      // Reload list to get updated status
      setTimeout(() => {
        setShowEnrollModal(false);
        loadCourses();
      }, 1000);
    } catch (err) {
      setEnrollError("Gagal mendaftar: " + (err.message || err));
    }
  };

  const displayedCourses = enrolledCourses.filter((c) => c.category === activeTab);

  return (
    <div className="min-h-screen bg-[#f0f4f8] page-enter">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">📚 Kursus Saya</h2>
            <p className="text-white/70 mt-2 text-sm sm:text-base">
              {activeTab === "learning"
                ? "Mata pelajaran yang sedang kamu pelajari"
                : "Mata pelajaran yang kamu ajar"}
            </p>
          </div>
          <button
            onClick={() => {
              setEnrollError("");
              setEnrollSuccess("");
              setEnrollCode("");
              setShowEnrollModal(true);
            }}
            className="px-5 sm:px-6 py-3 bg-white text-purple-700 rounded-xl font-semibold hover:bg-white/90 hover:-translate-y-0.5 transition-all flex items-center gap-2 shadow-lg"
          >
            <span>➕</span> Enroll Kursus
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6">
        {/* Loading */}
        {loading && (
          <div className="content-card text-center py-16">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Memuat kursus...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-yellow-50 border border-yellow-100 text-yellow-700 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {!loading && (
          <>
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm flex mb-8 overflow-hidden">
              <button
                onClick={() => setActiveTab("learning")}
                className={'tab flex-1 text-center py-4 text-sm sm:text-base ' + (activeTab === "learning" ? "active" : "")}
              >
                <span className="text-lg mr-2">📖</span>
                Sedang Dipelajari
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {enrolledCourses.filter((c) => c.category === "learning").length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("teaching")}
                className={'tab flex-1 text-center py-4 text-sm sm:text-base ' + (activeTab === "teaching" ? "active" : "")}
              >
                <span className="text-lg mr-2">🎓</span>
                Sedang Diajar
                <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  {enrolledCourses.filter((c) => c.category === "teaching").length}
                </span>
              </button>
            </div>

            {/* Empty state */}
            {displayedCourses.length === 0 ? (
              <div className="content-card text-center py-16">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">Belum ada kursus</h3>
                <p className="text-gray-500 mb-6">
                  {activeTab === "learning"
                    ? "Kamu belum mendaftar ke mata pelajaran manapun. Klik tombol Enroll untuk mulai!"
                    : "Kamu belum terdaftar sebagai pengajar. Klik tombol Enroll untuk mulai mengajar!"}
                </p>
                <button
                  onClick={() => { setShowEnrollModal(true); setEnrollCode(""); }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  ➕ Enroll Kursus
                </button>
              </div>
            ) : (
              /* Table */
              <div className="content-card overflow-x-auto">
                <table className="course-table">
                  <thead>
                    <tr>
                      <th style={{ width: "50px" }}>No</th>
                      <th style={{ width: "100px" }}>Kode</th>
                      <th>Nama Mata Pelajaran</th>
                      <th>Deskripsi</th>
                      <th style={{ width: "100px" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedCourses.map((course, idx) => (
                      <tr key={course.courseCode + '-' + course.category}>
                        <td className="font-mono text-sm text-gray-400">
                          {String(idx + 1).padStart(2, "0")}
                        </td>
                        <td>
                          <span className="inline-flex px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-mono font-bold text-xs border border-indigo-100">
                            {course.courseCode}
                          </span>
                        </td>
                        <td className="font-semibold text-gray-800">
                          {course.courseName}
                        </td>
                        <td className="text-gray-500 text-sm">
                          {course.description || "-"}
                        </td>
                        <td>
                          <button
                            onClick={() => navigate("/courses/" + course.id)}
                            className="btn-view"
                          >
                            Lihat →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Enroll Modal */}
        {showEnrollModal && (
          <div className="modal-overlay" onClick={() => setShowEnrollModal(false)}>
            <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">➕ Enroll Kursus</h3>
              <p className="text-gray-500 mb-6">
                Masukkan kode mata pelajaran untuk mendaftar sebagai{" "}
                <strong>{activeTab === "learning" ? "Siswa" : "Pengajar"}</strong>.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kode Mata Pelajaran
                </label>
                <input
                  type="text"
                  value={enrollCode}
                  onChange={(e) => setEnrollCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleEnroll()}
                  placeholder="Contoh: MTK-001"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg font-mono text-center tracking-widest focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
                  autoFocus
                />
              </div>

              {enrollError && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
                  <span>❌</span> {enrollError}
                </div>
              )}
              {enrollSuccess && (
                <div className="bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
                  <span>✅</span> {enrollSuccess}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleEnroll}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  Daftar Sekarang
                </button>
                <button
                  onClick={() => setShowEnrollModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Batal
                </button>
              </div>

              {/* Quick code reference */}
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-semibold text-gray-500 mb-2">KODE CEPAT:</p>
                <div className="flex flex-wrap gap-1.5">
                  {allCourses.slice(0, 10).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setEnrollCode(c.courseCode)}
                      className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-600 hover:border-purple-400 hover:text-purple-700 transition-all"
                    >
                      {c.courseCode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
