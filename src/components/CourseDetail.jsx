import { useState, useEffect } from "react";
import { courses, sectionTemplates } from "../data/mockData";
import { api } from "../api/client";
import QRAttendance from "./QRAttendance";
import QuizEngine from "./QuizEngine";
import Forum from "./Forum";
import CalendarWidget from "./CalendarWidget";
import Gradebook from "./Gradebook";

function ExpandableSection({ section, content, isOpen, onToggle, role, onSave, courseId }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content || "");
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState("");

  // Load files from API
  useEffect(() => {
    setFilesLoading(true);
    api.getCourse(courseId)
      .then((data) => {
        const sectionFiles = data.sections?.[section.key]?.files || [];
        setFiles(sectionFiles);
      })
      .catch(() => {
        // Fallback to localStorage
        try {
          const localFiles = JSON.parse(localStorage.getItem('files_' + courseId + '_' + section.key) || "[]");
          setFiles(localFiles);
        } catch {}
      })
      .finally(() => setFilesLoading(false));
  }, [courseId, section.key]);

  const handleSave = () => {
    onSave(section.key, editContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(content || "");
    setIsEditing(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFilesError("");
    const reader = new FileReader();
    reader.onload = () => {
      const newFile = {
        id: Date.now(),
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        type: file.type,
        data: reader.result,
        uploadedAt: new Date().toLocaleDateString("id-ID"),
      };
      const updatedFiles = [...files, newFile];
      setFiles(updatedFiles);
      // Try saving to API via updateCourse with sections
      api.updateCourse(courseId, {
        sections: { [section.key]: { files: updatedFiles } }
      }).catch(() => {
        // Fallback to localStorage
        localStorage.setItem('files_' + courseId + '_' + section.key, JSON.stringify(updatedFiles));
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteFile = (fileId) => {
    const updatedFiles = files.filter((f) => f.id !== fileId);
    setFiles(updatedFiles);
    api.updateCourse(courseId, {
      sections: { [section.key]: { files: updatedFiles } }
    }).catch(() => {
      localStorage.setItem('files_' + courseId + '_' + section.key, JSON.stringify(updatedFiles));
    });
  };

  return (
    <div className="expandable-section">
      <div className="expandable-header" onClick={onToggle}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{section.icon}</span>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">{section.title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {isOpen ? "Klik untuk menutup" : "Klik untuk membuka"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {role === "lecturer" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isEditing) { handleSave(); } else { setIsEditing(true); setEditContent(content || ""); }
              }}
              className={'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ' + (
                isEditing
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-blue-50 text-blue-600 hover:bg-blue-100"
              )}
            >
              {isEditing ? "💾 Simpan" : "✏️ Edit"}
            </button>
          )}
          <span className={'expandable-arrow ' + (isOpen ? "open" : "")}>▼</span>
        </div>
      </div>

      <div className={'expandable-content ' + (isOpen ? "open" : "")}>
        {isEditing ? (
          <div>
            <textarea
              className="editor-textarea"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Tulis konten di sini..."
            />
            <div className="flex gap-2 mt-3">
              <button onClick={handleSave} className="px-5 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
                💾 Simpan Perubahan
              </button>
              <button onClick={handleCancel} className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
                Batal
              </button>
            </div>
          </div>
        ) : (
          <div className="prose text-gray-600 leading-relaxed whitespace-pre-line">
            {content || <span className="text-gray-400 italic">Belum ada konten. Pengajar dapat mengisi bagian ini.</span>}
          </div>
        )}

        {/* File section */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          {role === "lecturer" && (
            <div className="mb-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium cursor-pointer hover:bg-indigo-100 transition-colors">
                <span>📎</span> Upload File
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>
              <span className="text-xs text-gray-400 ml-2">PDF, dokumen, gambar, dll.</span>
            </div>
          )}

          {filesError && <p className="text-xs text-red-500 mb-2">{filesError}</p>}
          {filesLoading && (
            <div className="space-y-2">
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-3/4" />
            </div>
          )}

          {!filesLoading && files.length > 0 ? (
            <div className="space-y-2">
              {files.map((f) => (
                <div key={f.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2.5 hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl">{f.type?.includes("image") ? "🖼️" : f.type?.includes("pdf") ? "📕" : "📄"}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{f.name}</p>
                      <p className="text-xs text-gray-400">{f.size} • {f.uploadedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={f.data}
                      download={f.name}
                      className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                    >
                      ⬇ Download
                    </a>
                    {role === "lecturer" && (
                      <button onClick={() => handleDeleteFile(f.id)} className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        🗑
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : !filesLoading && (
            <p className="text-xs text-gray-400">Belum ada file di bagian ini.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AssignmentSection({ courseId, role }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", deadline: "" });

  // Load assignments from API
  useEffect(() => {
    setLoading(true);
    api.getCourse(courseId)
      .then((data) => {
        setAssignments(data.assignments || []);
      })
      .catch(() => {
        // Fallback to localStorage
        try {
          setAssignments(JSON.parse(localStorage.getItem('assignments_' + courseId) || "[]"));
        } catch {}
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  // Cache in localStorage as fallback
  useEffect(() => {
    if (assignments.length > 0) {
      localStorage.setItem('assignments_' + courseId, JSON.stringify(assignments));
    }
  }, [assignments, courseId]);

  const handleCreateAssignment = () => {
    if (!newTask.title || !newTask.deadline) return;
    const newAssignment = {
      id: Date.now(),
      ...newTask,
      createdAt: new Date().toLocaleDateString("id-ID"),
      submissions: [],
    };
    const updated = [...assignments, newAssignment];
    setAssignments(updated);
    setNewTask({ title: "", description: "", deadline: "" });
    setShowForm(false);
    // Try API
    api.updateCourse(courseId, { assignments: updated }).catch(() => {});
  };

  const handleSubmitAssignment = (assignmentId, file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const updated = assignments.map((a) =>
        a.id === assignmentId
          ? {
              ...a,
              submissions: [
                ...a.submissions,
                {
                  id: Date.now(),
                  fileName: file.name,
                  data: reader.result,
                  submittedAt: new Date().toLocaleDateString("id-ID"),
                  student: "Kamu",
                },
              ],
            }
          : a
      );
      setAssignments(updated);
      api.updateCourse(courseId, { assignments: updated }).catch(() => {});
    };
    reader.readAsDataURL(file);
  };

  const now = new Date();

  if (loading) return (
    <div className="mt-6 space-y-3">
      <div className="skeleton h-6 w-40" />
      <div className="skeleton h-24 w-full" />
      <div className="skeleton h-24 w-full" />
    </div>
  );

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">📝 Daftar Tugas</h3>
        {role === "lecturer" && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors"
          >
            ➕ Buat Tugas
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-indigo-50 rounded-xl p-4 mb-4 border border-indigo-100">
          <input
            type="text"
            placeholder="Judul tugas..."
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            className="w-full px-4 py-2 border border-indigo-200 rounded-lg mb-2 focus:outline-none focus:border-indigo-400 text-sm"
          />
          <textarea
            placeholder="Deskripsi tugas..."
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            className="w-full px-4 py-2 border border-indigo-200 rounded-lg mb-2 focus:outline-none focus:border-indigo-400 text-sm h-20"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tenggat Waktu</label>
              <input
                type="datetime-local"
                value={newTask.deadline}
                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                className="px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-400 text-sm"
              />
            </div>
            <div className="flex gap-2 self-end">
              <button onClick={handleCreateAssignment} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">
                Simpan Tugas
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-300">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <span className="text-3xl block mb-2">📋</span>
          <p className="text-sm text-gray-400">Belum ada tugas untuk kursus ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => {
            const deadlineDate = new Date(a.deadline);
            const isOverdue = deadlineDate < now;
            return (
              <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-800">{a.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{a.description}</p>
                  </div>
                  <span className={'badge text-xs ' + (isOverdue ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600")}>
                    {isOverdue ? "⏰ Tertutup" : "🟢 Buka"}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span>📅 Dibuat: {a.createdAt}</span>
                  <span>⏳ Tenggat: {new Date(a.deadline).toLocaleString("id-ID")}</span>
                  <span>📤 Terkumpul: {a.submissions.length}</span>
                </div>

                {role === "student" && !isOverdue && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium cursor-pointer hover:bg-blue-100 transition-colors">
                      📤 Kumpulkan Tugas
                      <input
                        type="file"
                        onChange={(e) => { if (e.target.files[0]) handleSubmitAssignment(a.id, e.target.files[0]); }}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {role === "lecturer" && a.submissions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-2">📥 Tugas Terkumpul:</p>
                    {a.submissions.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span>📄</span>
                          <span className="text-sm text-gray-700">{sub.fileName}</span>
                          <span className="text-xs text-gray-400">• {sub.student} • {sub.submittedAt}</span>
                        </div>
                        <a href={sub.data} download={sub.fileName} className="text-xs text-blue-600 hover:underline">
                          ⬇ Download
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {role === "student" && a.submissions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-green-600">✅ Tugas sudah dikumpulkan</p>
                    {a.submissions.map((sub) => (
                      <div key={sub.id} className="text-xs text-gray-500 mt-1">
                        📄 {sub.fileName} — {sub.submittedAt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CourseDetail({ courseId, courseCode, setCurrentPage, role, user }) {
  const course = courses.find((c) => c.id === courseId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openSections, setOpenSections] = useState(() => {
    const initial = {};
    sectionTemplates.forEach((s) => (initial[s.key] = false));
    initial.generalInfo = true;
    return initial;
  });
  const [details, setDetails] = useState({});
  const [allLecturers, setAllLecturers] = useState([]);
  const [showAddLecturer, setShowAddLecturer] = useState(false);
  const [newLecturerName, setNewLecturerName] = useState("");

  // Load course data from API
  useEffect(() => {
    setLoading(true);
    setError("");
    api.getCourse(courseId)
      .then((data) => {
        // Load section content
        const sections = {};
        sectionTemplates.forEach((s) => {
          sections[s.key] = data.sections?.[s.key]?.content || data[s.key] || "";
        });
        setDetails(sections);

        // Merge lecturers: API data takes precedence, deduplicate
        const apiLecturers = data.lecturers || [];
        const courseLecturers = course?.lecturers || [];
        const merged = [...new Set([...apiLecturers, ...courseLecturers])];
        setAllLecturers(merged);
      })
      .catch((err) => {
        setError("Gagal memuat data kursus. Menggunakan data lokal.");
        // Fallback to localStorage
        try {
          const saved = JSON.parse(localStorage.getItem('courseDetails_' + courseId));
          if (saved) setDetails(saved);
        } catch {}
        try {
          const savedLec = JSON.parse(localStorage.getItem('lecturers_' + courseId) || "[]");
          if (savedLec.length > 0) setAllLecturers(savedLec);
          else setAllLecturers(course?.lecturers || []);
        } catch {
          setAllLecturers(course?.lecturers || []);
        }
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (key, content) => {
    const updated = { ...details, [key]: content };
    setDetails(updated);
    // Save via API
    api.updateCourse(courseId, { sections: { [key]: { content } } }).catch(() => {
      // Fallback to localStorage
      localStorage.setItem('courseDetails_' + courseId, JSON.stringify(updated));
    });
  };

  const handleAddLecturer = () => {
    if (newLecturerName.trim()) {
      const updated = [...allLecturers, newLecturerName.trim()];
      setAllLecturers(updated);
      setNewLecturerName("");
      setShowAddLecturer(false);
      api.updateCourse(courseId, { lecturers: updated }).catch(() => {
        localStorage.setItem('lecturers_' + courseId, JSON.stringify(updated));
      });
    }
  };

  const handleRemoveLecturer = (index) => {
    const updated = allLecturers.filter((_, i) => i !== index);
    setAllLecturers(updated);
    api.updateCourse(courseId, { lecturers: updated }).catch(() => {
      localStorage.setItem('lecturers_' + courseId, JSON.stringify(updated));
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="text-center page-enter">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Memuat detail kursus...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="text-center max-w-md page-enter">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => setCurrentPage("courses")} className="px-6 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors">
            ← Kembali ke Kursus Saya
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="text-center page-enter">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">Kursus Tidak Ditemukan</h3>
          <p className="text-gray-500 mb-4">Mata pelajaran yang kamu cari tidak tersedia.</p>
          <button onClick={() => setCurrentPage("courses")} className="px-6 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors">
            ← Kembali ke Kursus Saya
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* Header */}
      <div
        className="relative py-12 sm:py-16 px-4 sm:px-6"
        style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2d1b69 100%)" }}
      >
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => setCurrentPage("courses")}
            className="text-white/60 hover:text-white mb-6 flex items-center gap-2 transition-colors text-sm"
          >
            ← Kembali ke Kursus Saya
          </button>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex px-3 py-1.5 bg-white/20 text-white rounded-lg font-mono font-bold text-sm border border-white/20">
                  {course.courseCode}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
                {course.courseName}
              </h2>
              <div className="flex flex-wrap gap-3 items-center">
                <span className="badge bg-white/20 text-white border border-white/30">
                  🏛 {course.faculty}
                </span>
              </div>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              {allLecturers.length > 0 ? (
                allLecturers.map((lec, i) => (
                  <span key={i} className="badge bg-purple-400/20 text-purple-200 border border-purple-400/30">
                    👨🏫 {lec}
                  </span>
                ))
              ) : (
                <span className="text-sm text-white/50 italic">Belum ada pengajar</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role indicator + Add Lecturer */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-4">
        <div className="bg-white rounded-xl px-4 sm:px-6 py-3 shadow-sm flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-sm text-gray-500">Melihat sebagai:</span>
          <span className={'badge ' + (role === "lecturer" ? "badge-lecturer" : "badge-student")}>
            {role === "lecturer" ? "👨🏫 Pengajar (Dapat Mengedit)" : "👨🎓 Siswa (Hanya Melihat)"}
          </span>

          {role === "lecturer" && (
            <>
              <button
                onClick={() => setShowAddLecturer(!showAddLecturer)}
                className="ml-auto px-4 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
              >
                ➕ Tambah Pengajar
              </button>

              {allLecturers.map((lec, i) => (
                <button
                  key={i}
                  onClick={() => handleRemoveLecturer(i)}
                  className="text-xs text-red-400 hover:text-red-600 ml-1 transition-colors"
                  title="Hapus pengajar"
                >
                  ✕
                </button>
              ))}
            </>
          )}
        </div>

        {showAddLecturer && (
          <div className="bg-white rounded-xl px-4 sm:px-6 py-4 shadow-sm mb-6 flex items-center gap-3 flex-wrap">
            <input
              type="text"
              value={newLecturerName}
              onChange={(e) => setNewLecturerName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddLecturer()}
              placeholder="Nama lengkap pengajar..."
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all"
              autoFocus
            />
            <button onClick={handleAddLecturer} className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors">
              Tambah
            </button>
            <button onClick={() => setShowAddLecturer(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors">
              Batal
            </button>
          </div>
        )}
      </div>

      {/* Sections */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        {sectionTemplates.map((section) => (
          <ExpandableSection
            key={section.key}
            section={section}
            content={details[section.key] || ""}
            isOpen={!!openSections[section.key]}
            onToggle={() => toggleSection(section.key)}
            role={role}
            onSave={handleSave}
            courseId={courseId}
          />
        ))}

        {/* Assignment section */}
        <div className="expandable-section mt-4">
          <div className="expandable-header">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">PENILAIAN & TUGAS</h3>
                <p className="text-xs text-gray-400 mt-0.5">Daftar tugas dan pengumpulan</p>
              </div>
            </div>
          </div>
          <div className="expandable-content open">
            <AssignmentSection courseId={courseId} role={role} />
          </div>
        </div>

        {/* QR Attendance Section */}
        <div className="expandable-section mt-4">
          <div className="expandable-header">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">ABSENSI QR</h3>
                <p className="text-xs text-gray-400 mt-0.5">Scan QR Code untuk mencatat kehadiran</p>
              </div>
            </div>
          </div>
          <div className="expandable-content open">
            <QRAttendance courseCode={courseCode || 'COURSE-' + courseId} role={role} />
          </div>
        </div>

        {/* Quiz Section */}
        <div className="expandable-section mt-4">
          <div className="expandable-header">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">KUIS</h3>
                <p className="text-xs text-gray-400 mt-0.5">Latihan soal, ujian, dan penilaian otomatis</p>
              </div>
            </div>
          </div>
          <div className="expandable-content open">
            <QuizEngine courseId={courseId} role={role} />
          </div>
        </div>

        {/* Forum Section */}
        <div className="expandable-section mt-4">
          <div className="expandable-header">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💬</span>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">FORUM DISKUSI</h3>
                <p className="text-xs text-gray-400 mt-0.5">Diskusi, tanya jawab, dan pengumuman</p>
              </div>
            </div>
          </div>
          <div className="expandable-content open">
            <Forum courseId={courseId} role={role} />
          </div>
        </div>

        {/* Calendar Section */}
        <div className="expandable-section mt-4">
          <div className="expandable-header">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">KALENDER</h3>
                <p className="text-xs text-gray-400 mt-0.5">Jadwal, deadline, dan event penting</p>
              </div>
            </div>
          </div>
          <div className="expandable-content open">
            <CalendarWidget courseId={courseId} role={role} />
          </div>
        </div>

        {/* Gradebook Section */}
        <div className="expandable-section mt-4">
          <div className="expandable-header">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">GRADEBOOK</h3>
                <p className="text-xs text-gray-400 mt-0.5">Rekap nilai, bobot, dan export laporan</p>
              </div>
            </div>
          </div>
          <div className="expandable-content open">
            <Gradebook courseId={courseId} role={role} />
          </div>
        </div>
      </div>
    </div>
  );
}
