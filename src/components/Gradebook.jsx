import { useState, useEffect } from "react";
import { api } from "../api/client";

export default function Gradebook({ courseId, role }) {
  const [components, setComponents] = useState([]);
  const [gradesList, setGradesList] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modals & Entry States
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [newComponent, setNewComponent] = useState({ name: "", weight: 0.2, maxScore: 100 });
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [newGrade, setNewGrade] = useState({ componentId: "", studentId: "", score: "" });

  const isLecturer = role === "lecturer" || role === "admin";

  const loadGradebookData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getGradebook(courseId);
      setComponents(data.components || []);
      setGradesList(data.grades || []);

      if (isLecturer) {
        const students = await api.getEnrolledStudents(courseId);
        setEnrolledStudents(students);
      }
    } catch (err) {
      setError("Gagal memuat gradebook: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGradebookData();
  }, [courseId]);

  const handleAddComponent = async (e) => {
    e.preventDefault();
    setError("");
    if (!newComponent.name.trim()) return;

    try {
      await api.addGradeComponent({
        course_id: courseId,
        name: newComponent.name,
        weight: parseFloat(newComponent.weight),
        max_score: parseInt(newComponent.maxScore, 10)
      });
      setSuccess("Komponen nilai baru berhasil ditambahkan!");
      setShowAddComponent(false);
      setNewComponent({ name: "", weight: 0.2, maxScore: 100 });
      loadGradebookData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Gagal menambah komponen: " + (err.message || err));
    }
  };

  const handleRemoveComponent = async (id) => {
    if (!confirm("Apakah Anda yakin ingin menghapus komponen nilai ini beserta semua nilai siswa di dalamnya?")) return;
    setError("");
    try {
      await api.removeGradeComponent(id);
      setSuccess("Komponen nilai berhasil dihapus!");
      loadGradebookData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Gagal menghapus komponen: " + (err.message || err));
    }
  };

  const handleAddGrade = async (e) => {
    e.preventDefault();
    setError("");
    if (!newGrade.componentId || !newGrade.studentId || newGrade.score === "") return;

    try {
      await api.updateGrade({
        component_id: parseInt(newGrade.componentId, 10),
        student_id: parseInt(newGrade.studentId, 10),
        score: parseFloat(newGrade.score)
      });
      setSuccess("Nilai berhasil disimpan!");
      setShowAddGrade(false);
      setNewGrade({ componentId: "", studentId: "", score: "" });
      loadGradebookData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Gagal menyimpan nilai: " + (err.message || err));
    }
  };

  const calculateFinalGrade = (studentGrades) => {
    let finalScore = 0;
    let totalWeight = 0;

    components.forEach((c) => {
      const studentGrade = studentGrades.find(g => g.componentId === c.id);
      if (studentGrade) {
        // Calculate weighted score based on components
        const score = studentGrade.score || 0;
        finalScore += (score / c.maxScore) * c.weight * 100;
        totalWeight += c.weight;
      }
    });

    if (totalWeight === 0) return 0;
    // Normalize to 100 if weights don't sum to 1.0 (or just return direct weighted sum)
    return Math.round(finalScore * 100) / 100;
  };

  const handleExportCSV = () => {
    if (components.length === 0) return;
    
    // Group grades by student
    const studentGradesMap = {};
    gradesList.forEach(g => {
      if (!studentGradesMap[g.studentId]) {
        studentGradesMap[g.studentId] = {
          studentName: g.studentName,
          displayName: g.displayName || g.studentName,
          scores: {}
        };
      }
      studentGradesMap[g.studentId].scores[g.componentId] = g.score;
    });

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nama Siswa," + components.map(c => `${c.name} (${c.weight * 100}%)`).join(",") + ",Nilai Akhir\n";

    Object.values(studentGradesMap).forEach((student) => {
      const rowGrades = components.map(c => student.scores[c.id] || 0);
      const studentGradesList = components.map(c => ({ componentId: c.id, score: student.scores[c.id] || 0 }));
      const finalGrade = calculateFinalGrade(studentGradesList);
      
      csvContent += `${student.displayName},` + rowGrades.join(",") + `,${finalGrade}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Gradebook_Course_${courseId}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Group grades by student for rendering
  const studentGradesMap = {};
  gradesList.forEach(g => {
    if (!studentGradesMap[g.studentId]) {
      studentGradesMap[g.studentId] = {
        studentId: g.studentId,
        studentName: g.studentName,
        displayName: g.displayName || g.studentName,
        grades: []
      };
    }
    studentGradesMap[g.studentId].grades.push({ componentId: g.componentId, score: g.score });
  });

  const students = Object.values(studentGradesMap);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h3 className="font-bold text-gray-800 text-lg">📊 GRADEBOOK</h3>
        <div className="flex gap-2">
          {isLecturer && (
            <>
              <button
                onClick={() => setShowAddComponent(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                ➕ Tambah Komponen
              </button>
              <button
                onClick={() => setShowAddGrade(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                📝 Masukkan Nilai
              </button>
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold"
              >
                📥 Export CSV
              </button>
            </>
          )}
        </div>
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
        <p className="text-center py-6 text-gray-400">Memuat gradebook...</p>
      ) : components.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed">
          <p className="text-gray-400">Belum ada komponen nilai yang dikonfigurasi.</p>
        </div>
      ) : (
        <div className="content-card overflow-x-auto border border-gray-200 rounded-2xl shadow-sm">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                <th className="p-4">Nama Siswa</th>
                {components.map(c => (
                  <th key={c.id} className="p-4 whitespace-nowrap">
                    <div className="flex items-center justify-between gap-4">
                      <span>
                        {c.name} <span className="text-xs text-gray-400">({c.weight * 100}%)</span>
                      </span>
                      {isLecturer && (
                        <button
                          onClick={() => handleRemoveComponent(c.id)}
                          className="text-[10px] text-red-400 hover:text-red-600 ml-1 font-normal"
                          title="Hapus komponen"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="p-4">Nilai Akhir (100)</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={components.length + 2} className="p-6 text-center text-gray-400">
                    Belum ada data nilai siswa.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const finalGrade = calculateFinalGrade(student.grades);
                  return (
                    <tr key={student.studentId} className="border-b border-gray-150 hover:bg-gray-50">
                      <td className="p-4 font-bold text-gray-700">{student.displayName}</td>
                      {components.map(c => {
                        const scoreRecord = student.grades.find(g => g.componentId === c.id);
                        return (
                          <td key={c.id} className="p-4 font-mono text-gray-600">
                            {scoreRecord ? scoreRecord.score : "-"}
                          </td>
                        );
                      })}
                      <td className="p-4 font-mono font-bold text-purple-700">{finalGrade}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Statistics dashboard widgets for lecturer */}
      {isLecturer && students.length > 0 && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            {
              label: "Rata-rata Kelas",
              value: (() => {
                const total = students.reduce((sum, s) => sum + calculateFinalGrade(s.grades), 0);
                return (total / students.length).toFixed(1);
              })(),
              icon: "📊",
              color: "blue"
            },
            {
              label: "Nilai Tertinggi",
              value: (() => {
                const grades = students.map(s => calculateFinalGrade(s.grades));
                return Math.max(...grades).toFixed(1);
              })(),
              icon: "🏆",
              color: "green"
            },
            {
              label: "Nilai Terendah",
              value: (() => {
                const grades = students.map(s => calculateFinalGrade(s.grades));
                return Math.min(...grades).toFixed(1);
              })(),
              icon: "📉",
              color: "red"
            },
            {
              label: "Tuntas (≥65)",
              value: (() => {
                const passed = students.filter(s => calculateFinalGrade(s.grades) >= 65).length;
                return passed + '/' + students.length + ' (' + Math.round(passed / students.length * 100) + '%)';
              })(),
              icon: "✅",
              color: "purple"
            }
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 text-center shadow-sm">
              <span className="text-2xl">{stat.icon}</span>
              <div className={`text-2xl font-bold mt-1 ${
                stat.color === "blue" ? "text-blue-600" : stat.color === "green" ? "text-green-600" :
                stat.color === "red" ? "text-red-600" : "text-purple-600"
              }`}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add Component Modal */}
      {showAddComponent && (
        <div className="modal-overlay" onClick={() => setShowAddComponent(false)}>
          <form
            onSubmit={handleAddComponent}
            className="modal-content max-w-sm space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-800">➕ Tambah Komponen Nilai</h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Nama Komponen</label>
              <input
                type="text"
                required
                placeholder="Contoh: UTS, UAS, Tugas 1..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none"
                value={newComponent.name}
                onChange={(e) => setNewComponent({ ...newComponent, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Bobot (0.0 s/d 1.0)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none"
                  value={newComponent.weight}
                  onChange={(e) => setNewComponent({ ...newComponent, weight: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Nilai Maksimal</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none"
                  value={newComponent.maxScore}
                  onChange={(e) => setNewComponent({ ...newComponent, maxScore: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold"
              >
                Simpan Komponen
              </button>
              <button
                type="button"
                onClick={() => setShowAddComponent(false)}
                className="px-4 py-2 bg-gray-150 text-gray-700 rounded-xl"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add/Edit Grade Modal */}
      {showAddGrade && (
        <div className="modal-overlay" onClick={() => setShowAddGrade(false)}>
          <form
            onSubmit={handleAddGrade}
            className="modal-content max-w-sm space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-800">📝 Masukkan / Update Nilai</h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Komponen Nilai</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none"
                value={newGrade.componentId}
                onChange={(e) => setNewGrade({ ...newGrade, componentId: e.target.value })}
              >
                <option value="">Pilih Komponen...</option>
                {components.map(c => (
                  <option key={c.id} value={c.id}>{c.name} (Max: {c.maxScore})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Siswa</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none"
                value={newGrade.studentId}
                onChange={(e) => setNewGrade({ ...newGrade, studentId: e.target.value })}
              >
                <option value="">Pilih Siswa...</option>
                {enrolledStudents.map(s => (
                  <option key={s.id} value={s.id}>{s.displayName || s.username}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Nilai</label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                placeholder="Skor..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none"
                value={newGrade.score}
                onChange={(e) => setNewGrade({ ...newGrade, score: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold"
              >
                Simpan Nilai
              </button>
              <button
                type="button"
                onClick={() => setShowAddGrade(false)}
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
