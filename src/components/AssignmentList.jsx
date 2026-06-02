import { useState, useEffect } from "react";
import { api } from "../api/client";

export default function AssignmentList({ courseId, role }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Lecturer - Create assignment modal & form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ title: "", description: "", dueDate: "", maxScore: 100 });

  // Student - Submit assignment modal & form state
  const [activeSubmitAssignment, setActiveSubmitAssignment] = useState(null);
  const [submissionData, setSubmissionData] = useState({ textContent: "", file: null });
  const [submitting, setSubmitting] = useState(false);

  // Lecturer - Submissions viewer & grading
  const [selectedSubmissionsAssignment, setSelectedSubmissionsAssignment] = useState(null);
  const [submissionsList, setSubmissionsList] = useState([]);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [gradeData, setGradeData] = useState({ score: "", feedback: "" });

  const loadAssignments = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getAssignments(courseId);
      setAssignments(data);
    } catch (err) {
      setError("Gagal memuat tugas: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [courseId]);

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setError("");
    if (!newAssignment.title.trim()) return;

    try {
      await api.createAssignment({
        course_id: courseId,
        title: newAssignment.title,
        description: newAssignment.description,
        due_date: newAssignment.dueDate,
        max_score: newAssignment.maxScore
      });
      setShowAddModal(false);
      setNewAssignment({ title: "", description: "", dueDate: "", maxScore: 100 });
      setSuccess("Tugas berhasil dipublikasikan!");
      loadAssignments();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Gagal membuat tugas: " + (err.message || err));
    }
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      let fileId = null;

      // Upload file first if chosen
      if (submissionData.file) {
        // We need a dummy section ID or we can pass a dummy since it needs section_id
        // Wait, database schema allows file_id in submissions, let's create a section_files entry
        // We can just use dummy section_id or look up one, wait! In database schema, section_files requires section_id!
        // But what if the student doesn't have a section_id? We can just pass section_id = 0 or we can modify the API, 
        // wait! Since we are using standard section files table, let's pass a dummy section_id or get the first section's id!
        // Wait, the API for sections has section_id. Let's see if we can pass a dummy section_id or if we should fetch section_id first.
        // Let's check course sections. If sections exist, use the first section id. If not, section_id can be 1 or dummy.
        // Let's query sections
        const sections = await api.getCourseSections(courseId);
        let sectionId = sections.length > 0 ? sections[0].id : null;
        if (!sectionId) {
          // If no section exists, let's create a dummy one or fail?
          // Instead, let's throw an error: "Unggah materi minimal 1 untuk bisa mengunggah tugas dengan file"
          // Or let's create a placeholder section inside database during migration? No, let's just ask student to upload text, 
          // or use first section as a bucket! If no section exists, let's create a temporary hidden section or display error.
          throw new Error("Tidak ada section materi untuk melampirkan file. Hubungi pengajar.");
        }

        const formData = new FormData();
        formData.append("file", submissionData.file);
        formData.append("section_id", sectionId);

        const uploadedFile = await api.uploadFile(formData);
        fileId = uploadedFile.id;
      }

      await api.submitAssignment(activeSubmitAssignment.id, {
        text_content: submissionData.textContent,
        file_id: fileId
      });

      setActiveSubmitAssignment(null);
      setSubmissionData({ textContent: "", file: null });
      setSuccess("Tugas berhasil dikumpulkan!");
      loadAssignments();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Gagal mengumpulkan tugas: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewSubmissions = async (assignment) => {
    setSelectedSubmissionsAssignment(assignment);
    setError("");
    try {
      const data = await api.getSubmissions(assignment.id);
      setSubmissionsList(data);
    } catch (err) {
      setError("Gagal memuat daftar pengumpulan: " + (err.message || err));
    }
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.gradeSubmission(gradingSubmission.id, {
        score: parseFloat(gradeData.score),
        feedback: gradeData.feedback
      });

      setGradingSubmission(null);
      setGradeData({ score: "", feedback: "" });
      setSuccess("Nilai berhasil disimpan!");
      // Reload submissions list
      const updated = await api.getSubmissions(selectedSubmissionsAssignment.id);
      setSubmissionsList(updated);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Gagal menilai tugas: " + (err.message || err));
    }
  };

  const handleFileDownload = async (fileId, fileName) => {
    try {
      const blob = await api.downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Gagal mengunduh file: " + (err.message || err));
    }
  };

  const isLecturer = role === "lecturer" || role === "admin";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 text-lg">📝 TUGAS KELAS</h3>
        {isLecturer && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all"
          >
            ➕ Buat Tugas Baru
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-100 text-green-600 rounded-xl text-sm">
          ✅ {success}
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-400 py-6">Memuat tugas...</p>
      ) : assignments.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed">
          <p className="text-gray-400">Belum ada tugas kelas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => {
            const hasSubmitted = assignment.submissionId !== null;
            const isGraded = assignment.score !== null && assignment.score !== undefined;
            const isOverdue = assignment.dueDate && new Date() > new Date(assignment.dueDate);

            return (
              <div key={assignment.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-bold text-gray-800 text-base">{assignment.title}</h4>
                    {assignment.dueDate && (
                      <p className="text-xs text-gray-400 mt-1">
                        ⏱ Batas waktu: {new Date(assignment.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                  {isLecturer ? (
                    <button
                      onClick={() => handleViewSubmissions(assignment)}
                      className="px-3.5 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-xs font-semibold transition-colors"
                    >
                      📁 Submissions ({assignment.submissionCount || 0})
                    </button>
                  ) : (
                    <div>
                      {isGraded ? (
                        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
                          Nilai: {assignment.score} / {assignment.maxScore}
                        </span>
                      ) : hasSubmitted ? (
                        <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-bold border border-yellow-100">
                          Terkumpul (Menunggu Nilai)
                        </span>
                      ) : isOverdue ? (
                        <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-100">
                          Terlambat
                        </span>
                      ) : (
                        <button
                          onClick={() => setActiveSubmitAssignment(assignment)}
                          className="px-4 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold transition-all shadow-sm"
                        >
                          📥 Kerjakan
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-gray-600 text-sm whitespace-pre-line bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  {assignment.description || "Tidak ada deskripsi."}
                </p>

                {/* Feedback section for student */}
                {!isLecturer && isGraded && assignment.feedback && (
                  <div className="bg-blue-50 border border-blue-100 text-blue-800 p-3 rounded-xl text-xs">
                    💬 <strong>Catatan Pengajar:</strong> {assignment.feedback}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Assignment Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <form
            onSubmit={handleCreateAssignment}
            className="modal-content max-w-md space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800">➕ Buat Tugas Baru</h3>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Judul Tugas</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-100"
                value={newAssignment.title}
                onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Instruksi Tugas</label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-100"
                value={newAssignment.description}
                onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Batas Waktu (Deadline)</label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-100 text-sm"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Skor Maksimal</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-100 text-sm"
                  value={newAssignment.maxScore}
                  onChange={(e) => setNewAssignment({ ...newAssignment, maxScore: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold"
              >
                Publikasikan
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-150 text-gray-700 rounded-xl"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Submit Assignment Modal */}
      {activeSubmitAssignment && (
        <div className="modal-overlay" onClick={() => setActiveSubmitAssignment(null)}>
          <form
            onSubmit={handleSubmitAssignment}
            className="modal-content max-w-md space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800">📥 Kumpulkan Tugas</h3>
            <p className="text-xs text-gray-500">{activeSubmitAssignment.title}</p>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Teks Jawaban</label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-100"
                placeholder="Tuliskan jawaban atau keterangan di sini..."
                value={submissionData.textContent}
                onChange={(e) => setSubmissionData({ ...submissionData, textContent: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Lampirkan File</label>
              <input
                type="file"
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                onChange={(e) => setSubmissionData({ ...submissionData, file: e.target.files[0] })}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50"
              >
                {submitting ? "Mengirim..." : "Kirim Pengumpulan"}
              </button>
              <button
                type="button"
                onClick={() => setActiveSubmitAssignment(null)}
                className="px-4 py-2 bg-gray-150 text-gray-700 rounded-xl"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Submissions List Modal (Lecturer only) */}
      {selectedSubmissionsAssignment && (
        <div className="modal-overlay" onClick={() => setSelectedSubmissionsAssignment(null)}>
          <div className="modal-content max-w-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">📁 Pengumpulan: {selectedSubmissionsAssignment.title}</h3>
              <button
                onClick={() => setSelectedSubmissionsAssignment(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {submissionsList.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-sm">Belum ada siswa yang mengumpulkan tugas ini.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {submissionsList.map((sub) => (
                  <div key={sub.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-gray-800 text-sm">{sub.displayName || sub.username}</span>
                        <span className="text-xs text-gray-400 ml-2">
                          {new Date(sub.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div>
                        {sub.score !== null ? (
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
                            Nilai: {sub.score}
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setGradingSubmission(sub);
                              setGradeData({ score: "", feedback: sub.feedback || "" });
                            }}
                            className="px-3 py-1 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-bold"
                          >
                            Beri Nilai
                          </button>
                        )}
                      </div>
                    </div>

                    {sub.textContent && (
                      <p className="text-xs text-gray-600 bg-white p-3 rounded-lg border border-gray-150 whitespace-pre-wrap">
                        {sub.textContent}
                      </p>
                    )}

                    {sub.fileId && (
                      <button
                        onClick={() => handleFileDownload(sub.fileId, sub.fileName)}
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                      >
                        📎 {sub.fileName} (Download)
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grading Form Modal */}
      {gradingSubmission && (
        <div className="modal-overlay" onClick={() => setGradingSubmission(null)}>
          <form
            onSubmit={handleGradeSubmission}
            className="modal-content max-w-sm space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-800">📝 Penilaian Tugas</h3>
            <p className="text-xs text-gray-400">Siswa: {gradingSubmission.displayName || gradingSubmission.username}</p>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Nilai (Maks {selectedSubmissionsAssignment.maxScore})</label>
              <input
                type="number"
                max={selectedSubmissionsAssignment.maxScore}
                min={0}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none"
                value={gradeData.score}
                onChange={(e) => setGradeData({ ...gradeData, score: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Feedback / Catatan</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none"
                value={gradeData.feedback}
                onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold"
              >
                Simpan Nilai
              </button>
              <button
                type="button"
                onClick={() => setGradingSubmission(null)}
                className="px-4 py-2 bg-gray-150 text-gray-700 rounded-xl"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
