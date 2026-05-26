import { useState, useEffect } from "react";

export default function Gradebook({ courseId, role }) {
  const [components, setComponents] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`gradebook_${courseId}`) || "[]"); }
    catch { return []; }
  });
  const [studentScores, setStudentScores] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`grades_${courseId}`) || "{}"); }
    catch { return {}; }
  });
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [newComponent, setNewComponent] = useState({ name: "", weight: 0, maxScore: 100 });
  const [editScores, setEditScores] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [showAddStudent, setShowAddStudent] = useState(false);

  useEffect(() => {
    localStorage.setItem(`gradebook_${courseId}`, JSON.stringify(components));
  }, [components, courseId]);

  useEffect(() => {
    localStorage.setItem(`grades_${courseId}`, JSON.stringify(studentScores));
  }, [studentScores, courseId]);

  const addComponent = () => {
    if (!newComponent.name.trim() || newComponent.weight <= 0) return;
    setComponents(prev => [...prev, { ...newComponent, id: Date.now() }]);
    setNewComponent({ name: "", weight: 0, maxScore: 100 });
    setShowAddComponent(false);
  };

  const removeComponent = (compId) => {
    setComponents(prev => prev.filter(c => c.id !== compId));
  };

  const updateScore = (student, componentId, score) => {
    setStudentScores(prev => ({
      ...prev,
      [student]: {
        ...(prev[student] || {}),
        [componentId]: Math.min(Number(score), components.find(c => c.id === componentId)?.maxScore || 100)
      }
    }));
  };

  const addStudent = () => {
    if (!studentName.trim()) return;
    if (studentScores[studentName]) return; // already exists
    setStudentScores(prev => ({ ...prev, [studentName]: {} }));
    setStudentName("");
    setShowAddStudent(false);
  };

  const removeStudent = (name) => {
    setStudentScores(prev => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

  const calculateFinalGrade = (student) => {
    const scores = studentScores[student] || {};
    let totalWeighted = 0;
    let totalWeight = 0;
    components.forEach(comp => {
      const score = scores[comp.id];
      if (score !== undefined && score !== null && score !== "") {
        totalWeighted += (score / comp.maxScore) * comp.weight;
        totalWeight += comp.weight;
      }
    });
    if (totalWeight === 0) return "-";
    return (totalWeighted / totalWeight * 100).toFixed(1);
  };

  const getLetterGrade = (percentage) => {
    if (percentage === "-") return "-";
    const pct = parseFloat(percentage);
    if (pct >= 85) return "A";
    if (pct >= 75) return "B+";
    if (pct >= 65) return "B";
    if (pct >= 55) return "C+";
    if (pct >= 50) return "C";
    if (pct >= 40) return "D";
    return "E";
  };

  const exportCSV = () => {
    const students = Object.keys(studentScores);
    if (students.length === 0) return;
    let csv = "Nama";
    components.forEach(c => { csv += `,${c.name} (${c.weight}%)`; });
    csv += ",Nilai Akhir,Huruf\n";
    students.forEach(name => {
      const final = calculateFinalGrade(name);
      csv += name;
      components.forEach(c => { csv += `,${studentScores[name]?.[c.id] || "-"}`; });
      csv += `,${final},${getLetterGrade(final)}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `nilai_course_${courseId}.csv`; a.click();
  };

  const students = Object.keys(studentScores);
  const totalWeight = components.reduce((s, c) => s + c.weight, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">📊 Gradebook</h3>
          <p className="text-sm text-gray-500">
            {components.length} komponen penilaian • {students.length} siswa
            {totalWeight !== 100 && totalWeight > 0 && (
              <span className="text-amber-500 ml-2">⚠️ Total bobot: {totalWeight}% (harus 100%)</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {role === "lecturer" && (
            <>
              <button onClick={() => setShowAddStudent(!showAddStudent)}
                className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors">
                ➕ Siswa
              </button>
              <button onClick={() => setShowAddComponent(!showAddComponent)}
                className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-colors">
                ➕ Komponen
              </button>
              <button onClick={() => setEditScores(!editScores)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  editScores ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>
                {editScores ? "🔒 Selesai Edit" : "✏️ Edit Nilai"}
              </button>
              <button onClick={exportCSV}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors">
                📥 Export CSV
              </button>
            </>
          )}
        </div>
      </div>

      {/* Add Student */}
      {showAddStudent && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addStudent()}
              placeholder="Nama siswa..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-green-500" autoFocus />
            <button onClick={addStudent} className="px-5 py-2 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600">Tambah</button>
            <button onClick={() => setShowAddStudent(false)} className="px-4 py-2 text-gray-400 text-sm hover:text-gray-600">Batal</button>
          </div>
        </div>
      )}

      {/* Add Component */}
      {showAddComponent && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
          <h4 className="font-semibold text-gray-700 text-sm mb-3">Komponen Penilaian Baru</h4>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nama</label>
              <input type="text" value={newComponent.name} onChange={e => setNewComponent(p => ({ ...p, name: e.target.value }))}
                placeholder="Contoh: UTS" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bobot (%)</label>
              <input type="number" value={newComponent.weight} onChange={e => setNewComponent(p => ({ ...p, weight: Number(e.target.value) }))}
                placeholder="30" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nilai Max</label>
              <input type="number" value={newComponent.maxScore} onChange={e => setNewComponent(p => ({ ...p, maxScore: Number(e.target.value) }))}
                placeholder="100" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addComponent} className="px-5 py-2 bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600">Simpan</button>
            <button onClick={() => setShowAddComponent(false)} className="px-5 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-300">Batal</button>
          </div>
        </div>
      )}

      {/* Grade Table */}
      {students.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <span className="text-5xl">📊</span>
          <p className="text-gray-500 mt-3">
            {role === "lecturer" ? "Tambahkan siswa dan komponen penilaian untuk memulai." : "Belum ada data nilai."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto">
          <table className="course-table">
            <thead>
              <tr>
                <th className="sticky left-0 bg-gray-50 z-10">Nama</th>
                {components.map(comp => (
                  <th key={comp.id} className="text-center">
                    <div>{comp.name}</div>
                    <div className="text-[10px] text-gray-400 font-normal">{comp.weight}%</div>
                    {role === "lecturer" && editScores && (
                      <button onClick={() => removeComponent(comp.id)} className="text-red-400 text-[10px] ml-1">✕</button>
                    )}
                  </th>
                ))}
                <th className="text-center bg-purple-50">
                  <div>Nilai Akhir</div>
                  <div className="text-[10px] text-purple-400 font-normal">Huruf</div>
                </th>
                {role === "lecturer" && editScores && <th className="w-10"></th>}
              </tr>
            </thead>
            <tbody>
              {students.sort().map(name => {
                const final = calculateFinalGrade(name);
                const letter = getLetterGrade(final);
                const letterColor = letter === "A" ? "text-green-600" : letter.startsWith("B") ? "text-blue-600" : letter.startsWith("C") ? "text-amber-600" : letter === "D" ? "text-orange-600" : letter === "E" ? "text-red-600" : "text-gray-400";
                return (
                  <tr key={name}>
                    <td className="sticky left-0 bg-white font-medium text-gray-700">{name}</td>
                    {components.map(comp => (
                      <td key={comp.id} className="text-center">
                        {editScores ? (
                          <input type="number" min="0" max={comp.maxScore}
                            value={studentScores[name]?.[comp.id] ?? ""}
                            onChange={e => updateScore(name, comp.id, e.target.value)}
                            className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-indigo-400"
                            placeholder="-" />
                        ) : (
                          <span className={`text-sm font-medium ${
                            (studentScores[name]?.[comp.id] ?? -1) >= comp.maxScore * 0.7 ? "text-green-600" :
                            (studentScores[name]?.[comp.id] ?? -1) >= comp.maxScore * 0.5 ? "text-amber-600" :
                            (studentScores[name]?.[comp.id] ?? -1) >= 0 ? "text-red-600" : "text-gray-300"
                          }`}>
                            {studentScores[name]?.[comp.id] ?? "-"}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 ml-1">/ {comp.maxScore}</span>
                      </td>
                    ))}
                    <td className="text-center bg-purple-50/50">
                      <span className="font-bold text-gray-800">{final === "-" ? "-" : final}</span>
                      <span className={`ml-1 text-xs font-bold ${letterColor}`}>{letter}</span>
                    </td>
                    {role === "lecturer" && editScores && (
                      <td>
                        <button onClick={() => removeStudent(name)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats for lecturer */}
      {role === "lecturer" && students.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Rata-rata Kelas", value: (() => {
              const grades = students.map(s => parseFloat(calculateFinalGrade(s))).filter(g => !isNaN(g));
              return grades.length > 0 ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1) : "-";
            })(), icon: "📈", color: "blue" },
            { label: "Nilai Tertinggi", value: (() => {
              const grades = students.map(s => parseFloat(calculateFinalGrade(s))).filter(g => !isNaN(g));
              return grades.length > 0 ? Math.max(...grades).toFixed(1) : "-";
            })(), icon: "🏆", color: "green" },
            { label: "Nilai Terendah", value: (() => {
              const grades = students.map(s => parseFloat(calculateFinalGrade(s))).filter(g => !isNaN(g));
              return grades.length > 0 ? Math.min(...grades).toFixed(1) : "-";
            })(), icon: "📉", color: "red" },
            { label: "Tuntas (≥65)", value: (() => {
              const passed = students.filter(s => parseFloat(calculateFinalGrade(s)) >= 65).length;
              return `${passed}/${students.length} (${Math.round(passed / students.length * 100)}%)`;
            })(), icon: "✅", color: "purple" },
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
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

      {/* Student view: only show own grades */}
      {role === "student" && students.length > 0 && (
        <div className="bg-blue-50 rounded-2xl p-5 mt-6 text-center">
          <span className="text-3xl">📊</span>
          <p className="text-sm text-blue-700 mt-2">
            Di mode production, kamu hanya bisa melihat nilaimu sendiri. Nilai di atas adalah data demo.
          </p>
        </div>
      )}
    </div>
  );
}
