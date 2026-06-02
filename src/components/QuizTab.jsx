import { useState, useEffect } from "react";
import { api } from "../api/client";

export default function QuizTab({ courseId, role }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [activeQuiz, setActiveQuiz] = useState(null);
  const [view, setView] = useState("list"); // "list" | "taker" | "builder" | "results" | "grader"

  // Builder States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);
  const [questions, setQuestions] = useState([
    { questionText: "", questionType: "mc", options: ["", "", "", ""], correctAnswer: "A", points: 10 }
  ]);

  // Taker States
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Results State
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [essayScores, setEssayScores] = useState({}); // mapping: resultId -> score

  const isLecturer = role === "lecturer" || role === "admin";

  const loadQuizzes = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getQuizByCourse(courseId);
      setQuizzes(data);
    } catch (err) {
      setError("Gagal memuat kuis: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, [courseId]);

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Judul kuis wajib diisi");
      return;
    }

    // Basic validation
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        setError(`Teks pertanyaan ke-${i + 1} wajib diisi.`);
        return;
      }
      if (q.questionType === "mc") {
        if (q.options.some(opt => !opt.trim())) {
          setError(`Semua opsi pilihan ganda pada pertanyaan ke-${i + 1} wajib diisi.`);
          return;
        }
      }
    }

    try {
      // Map to snake_case structure if direct mapping isn't used
      const payload = {
        course_id: courseId,
        title,
        description,
        time_limit: parseInt(timeLimit, 10),
        questions: questions.map(q => ({
          question_text: q.questionText,
          question_type: q.questionType,
          options: q.questionType === "mc" ? q.options : [],
          correct_answer: q.correctAnswer,
          points: parseInt(q.points || 10, 10)
        }))
      };

      await api.createQuiz(payload);
      setSuccess("Kuis baru berhasil dibuat!");
      setTitle("");
      setDescription("");
      setTimeLimit(30);
      setQuestions([{ questionText: "", questionType: "mc", options: ["", "", "", ""], correctAnswer: "A", points: 10 }]);
      setView("list");
      loadQuizzes();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Gagal membuat kuis: " + (err.message || err));
    }
  };

  const handleStartQuiz = async (quizId) => {
    setLoading(true);
    setError("");
    try {
      const quizWithQs = await api.getQuiz(quizId);
      setActiveQuiz(quizWithQs);
      setAnswers({});
      setView("taker");
    } catch (err) {
      setError("Gagal memuat kuis: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    setError("");
    setSubmitting(true);
    try {
      const submitRes = await api.submitQuiz(activeQuiz.id, answers);
      setSuccess(submitRes.message || "Kuis berhasil disubmit!");
      setView("list");
      loadQuizzes();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError("Gagal men-submit kuis: " + (err.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewResults = async (quiz) => {
    setLoading(true);
    setError("");
    setActiveQuiz(quiz);
    try {
      const data = await api.getQuizResults(quiz.id);
      setResults(data);
      setView("results");
    } catch (err) {
      setError("Gagal memuat hasil kuis: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleGradeEssay = async (resultId, currentScore, maxScore) => {
    const inputScore = prompt(`Masukkan nilai essay tambahan (Total nilai saat ini: ${currentScore}/${maxScore}):`, currentScore);
    if (inputScore === null) return;
    const finalScore = parseFloat(inputScore);
    if (isNaN(finalScore) || finalScore < 0 || finalScore > maxScore) {
      alert("Masukkan nilai yang valid antara 0 s/d " + maxScore);
      return;
    }

    setError("");
    try {
      await api.gradeQuizEssay(resultId, { score: finalScore });
      setSuccess("Nilai essay berhasil diperbarui!");
      // Reload results
      const data = await api.getQuizResults(activeQuiz.id);
      setResults(data);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Gagal memperbarui nilai essay: " + (err.message || err));
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { questionText: "", questionType: "mc", options: ["", "", "", ""], correctAnswer: "A", points: 10 }
    ]);
  };

  const removeQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx, fields) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], ...fields };
    setQuestions(updated);
  };

  const updateOption = (qIdx, optIdx, val) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = val;
    setQuestions(updated);
  };

  return (
    <div className="space-y-4">
      {success && (
        <div className="p-3 bg-green-50 border border-green-100 text-green-600 rounded-xl text-sm">
          ✅ {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* VIEW: QUIZ LIST */}
      {view === "list" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-lg">📝 DAFTAR KUIS KELAS</h3>
            {isLecturer && (
              <button
                onClick={() => setView("builder")}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all"
              >
                ➕ Buat Kuis Baru
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-center py-6 text-gray-400">Memuat data kuis...</p>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed">
              <p className="text-gray-400">Belum ada kuis yang dibuat.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((quiz) => {
                const isCompleted = quiz.score !== null && quiz.score !== undefined;
                return (
                  <div key={quiz.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-gray-800 text-base">{quiz.title}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">⏱ Durasi: {quiz.timeLimit || 30} menit</p>
                      <p className="text-gray-500 text-sm mt-2 line-clamp-2">{quiz.description || "Tidak ada deskripsi."}</p>
                    </div>

                    <div className="pt-4 flex justify-between items-center border-t border-gray-100 mt-4">
                      {isLecturer ? (
                        <button
                          onClick={() => handleViewResults(quiz)}
                          className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all"
                        >
                          📊 Hasil & Penilaian ({quiz.submissionCount || 0})
                        </button>
                      ) : (
                        <div>
                          {isCompleted ? (
                            <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
                              Selesai: {quiz.score} / {quiz.userMaxScore}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleStartQuiz(quiz.id)}
                              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                            >
                              ▶ Kerjakan Kuis
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW: QUIZ BUILDER */}
      {view === "builder" && (
        <form onSubmit={handleCreateQuiz} className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-lg">➕ PEMBUAT KUIS</h3>
            <button
              type="button"
              onClick={() => setView("list")}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
            >
              ← Batal
            </button>
          </div>

          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Judul Kuis</label>
                <input
                  type="text"
                  required
                  placeholder="Kuis Pertengahan Bab..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-100"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Durasi (Menit)</label>
                <input
                  type="number"
                  required
                  min={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-100"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Deskripsi Kuis</label>
              <textarea
                placeholder="Instruksi kuis..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-100"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 text-base">❓ Pertanyaan</h4>
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="p-5 bg-white border border-gray-200 rounded-2xl relative space-y-3">
                <button
                  type="button"
                  onClick={() => removeQuestion(qIdx)}
                  disabled={questions.length === 1}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-sm disabled:opacity-30"
                >
                  Hapus ✕
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Pertanyaan {qIdx + 1}</label>
                    <input
                      type="text"
                      placeholder="Masukkan teks pertanyaan..."
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-xl text-sm"
                      value={q.questionText}
                      onChange={(e) => updateQuestion(qIdx, { questionText: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500">Tipe</label>
                    <select
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-xl text-sm"
                      value={q.questionType}
                      onChange={(e) => updateQuestion(qIdx, { questionType: e.target.value, correctAnswer: e.target.value === "mc" ? "A" : e.target.value === "tf" ? "True" : "" })}
                    >
                      <option value="mc">Pilihan Ganda</option>
                      <option value="tf">Benar / Salah</option>
                      <option value="essay">Essay</option>
                    </select>
                  </div>
                </div>

                {q.questionType === "mc" && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {["A", "B", "C", "D"].map((optLetter, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-400">{optLetter}</span>
                        <input
                          type="text"
                          placeholder={`Pilihan ${optLetter}...`}
                          className="flex-1 px-3 py-1 border border-gray-300 rounded-lg text-xs"
                          value={q.options[optIdx]}
                          onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                          required
                        />
                      </div>
                    ))}
                  </div>
                )}

                {q.questionType !== "essay" && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Kunci Jawaban</label>
                      {q.questionType === "mc" ? (
                        <select
                          className="w-full px-3 py-1 border border-gray-300 rounded-xl text-xs"
                          value={q.correctAnswer}
                          onChange={(e) => updateQuestion(qIdx, { correctAnswer: e.target.value })}
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      ) : (
                        <select
                          className="w-full px-3 py-1 border border-gray-300 rounded-xl text-xs"
                          value={q.correctAnswer}
                          onChange={(e) => updateQuestion(qIdx, { correctAnswer: e.target.value })}
                        >
                          <option value="True">Benar (True)</option>
                          <option value="False">Salah (False)</option>
                        </select>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Poin Soal</label>
                      <input
                        type="number"
                        className="w-full px-3 py-1 border border-gray-300 rounded-xl text-xs"
                        value={q.points}
                        onChange={(e) => updateQuestion(qIdx, { points: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={addQuestion}
              className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50"
            >
              ➕ Tambah Soal
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-sm"
            >
              Simpan Kuis
            </button>
          </div>
        </form>
      )}

      {/* VIEW: QUIZ TAKER */}
      {view === "taker" && activeQuiz && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-800 text-lg">{activeQuiz.title}</h3>
              <p className="text-xs text-gray-400">Kerjakan kuis dengan cermat.</p>
            </div>
            <button
              onClick={() => {
                if (confirm("Keluar dari kuis? Progress pengerjaan Anda tidak akan tersimpan.")) { setView("list"); }
              }}
              className="px-3 py-1.5 bg-gray-150 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
            >
              Keluar ✕
            </button>
          </div>

          <div className="space-y-4">
            {activeQuiz.questions.map((q, idx) => (
              <div key={q.id} className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-gray-700 text-sm">{idx + 1}.</span>
                  <p className="font-medium text-gray-800 text-sm">{q.questionText}</p>
                </div>

                {q.questionType === "mc" && (
                  <div className="grid grid-cols-1 gap-2 pl-4">
                    {q.options && q.options.map((opt, optIdx) => {
                      const letter = ["A", "B", "C", "D"][optIdx];
                      const isSelected = answers[q.id] === letter;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => setAnswers({ ...answers, [q.id]: letter })}
                          className={`w-full text-left px-4 py-2 text-xs rounded-xl border transition-all ${
                            isSelected
                              ? "bg-blue-50 border-blue-400 text-blue-800 font-bold"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <span className="font-bold mr-2">{letter}.</span> {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.questionType === "tf" && (
                  <div className="flex gap-2 pl-4">
                    {["True", "False"].map((val) => {
                      const isSelected = answers[q.id] === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAnswers({ ...answers, [q.id]: val })}
                          className={`px-6 py-2 text-xs rounded-xl border transition-all ${
                            isSelected
                              ? "bg-blue-50 border-blue-400 text-blue-800 font-bold"
                              : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {val === "True" ? "Benar (True)" : "Salah (False)"}
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.questionType === "essay" && (
                  <div className="pl-4">
                    <textarea
                      rows={4}
                      placeholder="Tuliskan jawaban essay Anda di sini..."
                      className="w-full p-3 border border-gray-300 rounded-xl text-xs"
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmitQuiz}
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-md"
          >
            {submitting ? "Sedang mengirim..." : "Selesai & Kumpulkan Jawaban"}
          </button>
        </div>
      )}

      {/* VIEW: QUIZ RESULTS (LECTURER) */}
      {view === "results" && activeQuiz && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-800 text-lg">📊 Hasil Kuis: {activeQuiz.title}</h3>
              <p className="text-xs text-gray-400">Daftar nilai pengerjaan kuis siswa.</p>
            </div>
            <button
              onClick={() => setView("list")}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
            >
              ← Kembali
            </button>
          </div>

          {results.length === 0 ? (
            <p className="text-center py-6 text-gray-400 text-sm">Belum ada siswa yang mengerjakan kuis ini.</p>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 font-semibold text-left">
                    <th className="p-3">Siswa</th>
                    <th className="p-3">Nilai</th>
                    <th className="p-3">Waktu Submit</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((res) => (
                    <tr key={res.id} className="border-b border-gray-150 hover:bg-gray-50">
                      <td className="p-3 font-semibold text-gray-700">{res.displayName || res.username}</td>
                      <td className="p-3">
                        <span className="font-bold text-blue-600">{res.score}</span> / {res.maxScore}
                      </td>
                      <td className="p-3 text-xs text-gray-400">
                        {new Date(res.submittedAt).toLocaleString("id-ID")}
                      </td>
                      <td className="p-3 text-right">
                        {activeQuiz.questions && activeQuiz.questions.some(q => q.questionType === "essay") && (
                          <button
                            onClick={() => handleGradeEssay(res.id, res.score, res.maxScore)}
                            className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
                          >
                            Nilai Essay
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
