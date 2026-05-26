import { useState, useEffect } from "react";
import { courses, sectionTemplates } from "../data/mockData";
import QRAttendance from "./QRAttendance";

function ExpandableSection({ section, content, isOpen, onToggle, role, onSave, courseId }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content || "");
  const [files, setFiles] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`files_${courseId}_${section.key}`) || "[]"); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(`files_${courseId}_${section.key}`, JSON.stringify(files));
  }, [files, courseId, section.key]);

  const handleSave = () => { onSave(section.key, editContent); setIsEditing(false); };
  const handleCancel = () => { setEditContent(content || ""); setIsEditing(false); };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFiles([...files, {
        id: Date.now(), name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        type: file.type, data: reader.result,
        uploadedAt: new Date().toLocaleDateString("id-ID"),
      }]);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`cd-section ${isOpen ? "cd-section-open" : ""}`}>
      <div className="cd-section-header" onClick={onToggle}>
        <div className="cd-section-header-left">
          <div className="cd-section-icon-wrap">{section.icon}</div>
          <div>
            <h3 className="cd-section-title">{section.title}</h3>
            <p className="cd-section-hint">{isOpen ? "Klik untuk menutup" : "Klik untuk membuka"}</p>
          </div>
        </div>
        <div className="cd-section-header-right">
          {role === "lecturer" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isEditing) { handleSave(); } else { setIsEditing(true); setEditContent(content || ""); }
              }}
              className={`cd-edit-btn ${isEditing ? "cd-edit-btn-save" : "cd-edit-btn-edit"}`}
            >
              {isEditing ? "💾 Simpan" : "✏️ Edit"}
            </button>
          )}
          <span className={`cd-arrow ${isOpen ? "cd-arrow-open" : ""}`}>▼</span>
        </div>
      </div>

      {isOpen && (
        <div className="cd-section-body">
          {isEditing ? (
            <div>
              <textarea
                className="editor-textarea"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="Tulis konten di sini..."
                rows={5}
              />
              <div className="cd-edit-actions">
                <button onClick={handleSave} className="cd-btn-save">💾 Simpan Perubahan</button>
                <button onClick={handleCancel} className="cd-btn-cancel">Batal</button>
              </div>
            </div>
          ) : (
            <div className="cd-content-text">
              {content || <span className="cd-no-content">Belum ada konten. Pengajar dapat mengisi bagian ini.</span>}
            </div>
          )}

          {/* Files */}
          <div className="cd-files">
            {role === "lecturer" && (
              <label className="cd-upload-btn">
                <span>📎</span> Upload File
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>
            )}

            {files.length > 0 ? (
              <div className="cd-file-list">
                {files.map((f) => (
                  <div key={f.id} className="cd-file-item">
                    <div className="cd-file-info">
                      <span className="cd-file-type-icon">
                        {f.type?.includes("image") ? "🖼️" : f.type?.includes("pdf") ? "📕" : "📄"}
                      </span>
                      <div>
                        <p className="cd-file-name">{f.name}</p>
                        <p className="cd-file-meta">{f.size} · {f.uploadedAt}</p>
                      </div>
                    </div>
                    <div className="cd-file-actions">
                      <a href={f.data} download={f.name} className="cd-download-btn">⬇ Download</a>
                      {role === "lecturer" && (
                        <button
                          onClick={() => setFiles(files.filter((x) => x.id !== f.id))}
                          className="cd-delete-btn"
                        >🗑</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="cd-no-files">Belum ada file di bagian ini.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AssignmentSection({ courseId, role }) {
  const [assignments, setAssignments] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`assignments_${courseId}`) || "[]"); }
    catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", deadline: "" });

  useEffect(() => {
    localStorage.setItem(`assignments_${courseId}`, JSON.stringify(assignments));
  }, [assignments, courseId]);

  const handleCreateAssignment = () => {
    if (!newTask.title || !newTask.deadline) return;
    setAssignments([...assignments, {
      id: Date.now(), ...newTask,
      createdAt: new Date().toLocaleDateString("id-ID"),
      submissions: [],
    }]);
    setNewTask({ title: "", description: "", deadline: "" });
    setShowForm(false);
  };

  const handleSubmitAssignment = (assignmentId, file) => {
    const reader = new FileReader();
    reader.onload = () => {
      setAssignments((prev) => prev.map((a) =>
        a.id === assignmentId
          ? { ...a, submissions: [...a.submissions, {
              id: Date.now(), fileName: file.name,
              data: reader.result,
              submittedAt: new Date().toLocaleDateString("id-ID"),
              student: "Kamu",
            }]}
          : a
      ));
    };
    reader.readAsDataURL(file);
  };

  const now = new Date();

  return (
    <div className="cd-assignment">
      <div className="cd-assignment-header">
        {role === "lecturer" && (
          <button onClick={() => setShowForm(!showForm)} className="cd-assignment-add-btn" id="create-assignment-btn">
            ＋ Buat Tugas
          </button>
        )}
      </div>

      {showForm && (
        <div className="cd-assignment-form">
          <input
            type="text" placeholder="Judul tugas..."
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            className="cd-assignment-input"
          />
          <textarea
            placeholder="Deskripsi tugas (opsional)..."
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            className="cd-assignment-textarea"
            rows={2}
          />
          <div className="cd-assignment-form-row">
            <div>
              <label className="cd-assignment-form-label">Tenggat Waktu</label>
              <input
                type="datetime-local"
                value={newTask.deadline}
                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                className="cd-assignment-input"
              />
            </div>
            <div className="cd-assignment-form-actions">
              <button onClick={handleCreateAssignment} className="cd-btn-save">Simpan</button>
              <button onClick={() => setShowForm(false)} className="cd-btn-cancel">Batal</button>
            </div>
          </div>
        </div>
      )}

      {assignments.length === 0 ? (
        <div className="cd-no-assignments">
          <span>📝</span>
          <p>Belum ada tugas. {role === "lecturer" ? "Klik \"Buat Tugas\" untuk menambahkan." : "Tunggu pengajar menambahkan tugas."}</p>
        </div>
      ) : (
        <div className="cd-assignment-list">
          {assignments.map((a) => {
            const deadlineDate = new Date(a.deadline);
            const isOverdue = deadlineDate < now;
            return (
              <div key={a.id} className={`cd-assignment-card ${isOverdue ? "cd-assignment-card-closed" : "cd-assignment-card-open"}`}>
                <div className="cd-assignment-card-header">
                  <div>
                    <h4 className="cd-assignment-card-title">{a.title}</h4>
                    {a.description && <p className="cd-assignment-card-desc">{a.description}</p>}
                  </div>
                  <span className={`cd-assignment-status ${isOverdue ? "cd-status-closed" : "cd-status-open"}`}>
                    {isOverdue ? "⏰ Tertutup" : "🟢 Buka"}
                  </span>
                </div>
                <div className="cd-assignment-card-meta">
                  <span>📅 Dibuat: {a.createdAt}</span>
                  <span>⏳ Tenggat: {new Date(a.deadline).toLocaleString("id-ID")}</span>
                  <span>📤 Terkumpul: {a.submissions.length}</span>
                </div>

                {role === "student" && !isOverdue && (
                  <label className="cd-submit-btn">
                    📤 Kumpulkan Tugas
                    <input type="file" onChange={(e) => { if (e.target.files[0]) handleSubmitAssignment(a.id, e.target.files[0]); }} className="hidden" />
                  </label>
                )}

                {role === "student" && a.submissions.length > 0 && (
                  <div className="cd-submission-success">
                    ✅ Tugas sudah dikumpulkan
                    {a.submissions.map((sub) => (
                      <span key={sub.id} className="cd-submission-file">📄 {sub.fileName} — {sub.submittedAt}</span>
                    ))}
                  </div>
                )}

                {role === "lecturer" && a.submissions.length > 0 && (
                  <div className="cd-lecturer-submissions">
                    <p className="cd-lecturer-submissions-label">📥 Tugas Terkumpul:</p>
                    {a.submissions.map((sub) => (
                      <div key={sub.id} className="cd-lecturer-submission-item">
                        <div className="cd-file-info">
                          <span>📄</span>
                          <span className="text-sm text-gray-700">{sub.fileName}</span>
                          <span className="text-xs text-gray-400">· {sub.student} · {sub.submittedAt}</span>
                        </div>
                        <a href={sub.data} download={sub.fileName} className="cd-download-btn">⬇ Download</a>
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
  const [openSections, setOpenSections] = useState(() => {
    const initial = {};
    sectionTemplates.forEach((s) => (initial[s.key] = false));
    initial.generalInfo = true;
    return initial;
  });
  const [details, setDetails] = useState(() => {
    const saved = JSON.parse(localStorage.getItem(`courseDetails_${courseId}`));
    if (saved) return saved;
    const empty = {};
    sectionTemplates.forEach((s) => (empty[s.key] = ""));
    return empty;
  });
  const [lecturers, setLecturers] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`lecturers_${courseId}`) || "[]"); }
    catch { return []; }
  });
  const [showAddLecturer, setShowAddLecturer] = useState(false);
  const [newLecturerName, setNewLecturerName] = useState("");
  const [activeMainTab, setActiveMainTab] = useState("content");

  useEffect(() => {
    localStorage.setItem(`courseDetails_${courseId}`, JSON.stringify(details));
  }, [details, courseId]);

  useEffect(() => {
    localStorage.setItem(`lecturers_${courseId}`, JSON.stringify(lecturers));
  }, [lecturers, courseId]);

  const toggleSection = (key) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  const handleSave = (key, content) => setDetails((prev) => ({ ...prev, [key]: content }));
  const handleAddLecturer = () => {
    if (newLecturerName.trim()) {
      setLecturers([...lecturers, newLecturerName.trim()]);
      setNewLecturerName(""); setShowAddLecturer(false);
    }
  };

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Mata pelajaran tidak ditemukan.</p>
      </div>
    );
  }

  const allLecturers = [...(course.lecturers || []), ...lecturers];

  return (
    <div className="min-h-screen" style={{ background: "#f0f4f8" }}>
      {/* Hero header */}
      <div className="cd-hero">
        <div className="cd-hero-inner">
          <button onClick={() => setCurrentPage("courses")} className="cd-back-btn" id="back-to-courses-btn">
            ← Kembali ke Kursus
          </button>

          <div className="cd-hero-content">
            <div className="cd-hero-left">
              <span className="cd-hero-code">{course.courseCode}</span>
              <h2 className="cd-hero-title">{course.courseName}</h2>
              <div className="cd-hero-meta">
                <span className="cd-hero-faculty">🏛 {course.faculty}</span>
                <span className={`cd-hero-role-badge ${role === "lecturer" ? "cd-role-lecturer" : "cd-role-student"}`}>
                  {role === "lecturer" ? "👨‍🏫 Pengajar" : "👨‍🎓 Siswa"}
                </span>
              </div>
            </div>

            {/* Lecturers */}
            <div className="cd-hero-right">
              {allLecturers.length > 0 ? (
                <div className="cd-lecturers">
                  {allLecturers.map((lec, i) => (
                    <div key={i} className="cd-lecturer-chip">
                      <span className="cd-lecturer-avatar">{lec.charAt(0)}</span>
                      <span>{lec}</span>
                      {role === "lecturer" && lecturers.includes(lec) && (
                        <button
                          onClick={() => setLecturers(lecturers.filter((l) => l !== lec))}
                          className="cd-lecturer-remove"
                        >✕</button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="cd-no-lecturer">Belum ada pengajar</span>
              )}
              {role === "lecturer" && (
                <button
                  onClick={() => setShowAddLecturer(!showAddLecturer)}
                  className="cd-add-lecturer-btn"
                  id="add-lecturer-btn"
                >
                  ＋ Tambah Pengajar
                </button>
              )}
            </div>
          </div>

          {showAddLecturer && (
            <div className="cd-add-lecturer-form">
              <input
                type="text" value={newLecturerName}
                onChange={(e) => setNewLecturerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddLecturer()}
                placeholder="Nama lengkap pengajar..."
                className="cd-add-lecturer-input"
                autoFocus
                id="lecturer-name-input"
              />
              <button onClick={handleAddLecturer} className="cd-btn-save">Tambah</button>
              <button onClick={() => setShowAddLecturer(false)} className="cd-btn-cancel">Batal</button>
            </div>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="cd-main-tabs-wrap">
        <div className="cd-main-tabs">
          {[
            { key: "content",    icon: "📋", label: "Materi & Info" },
            { key: "assignment", icon: "📝", label: "Tugas" },
            { key: "attendance", icon: "📱", label: "Absensi QR" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveMainTab(tab.key)}
              className={`cd-main-tab ${activeMainTab === tab.key ? "cd-main-tab-active" : ""}`}
              id={`detail-tab-${tab.key}`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="cd-tab-content">
        {activeMainTab === "content" && (
          <div className="cd-sections">
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
          </div>
        )}

        {activeMainTab === "assignment" && (
          <div className="cd-sections">
            <AssignmentSection courseId={courseId} role={role} />
          </div>
        )}

        {activeMainTab === "attendance" && (
          <div className="cd-sections">
            <QRAttendance courseCode={courseCode || `COURSE-${courseId}`} role={role} />
          </div>
        )}
      </div>
    </div>
  );
}
