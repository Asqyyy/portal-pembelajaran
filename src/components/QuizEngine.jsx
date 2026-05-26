import { useState, useEffect } from "react";
import { api } from "../api/client";

const COURSE_ID_KEY_PREFIX = "quizzes_";

export default function QuizEngine({ courseId, role }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBuilder, setShowBuilder] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [resultsCache, setResultsCache] = useState({});

  // Quiz builder state
  const [newQuiz, setNewQuiz] = useState({
    title: "", description: "", duration: 30,
    questions: []
  });
  const [newQuestion, setNewQuestion] = useState({
    type: "multiple",
    text: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 10
  });

  // Fetch quizzes from API
  useEffect(() => {
    setLoading(true);
    setError("");
    api.getQuizByCourse(courseId)
      .then((data) => {
        setQuizzes(Array.isArray(data) ? data : (data.quizzes || []));
      })
      .catch((err) => {
        setError("Gagal memuat kuis.");
        // Fallback to localStorage
        try {
          const cached = JSON.parse(localStorage.getItem(COURSE_ID_KEY_PREFIX + courseId) || "[]");
          if (cached.length > 0) setQuizzes(cached);
        } catch {}
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  // Also load results
  useEffect(() => {
    api.getQuizResults(courseId)
      .then((data) => {
        const results = {};
        (Array.isArray(data) ? data : (data.results || [])).forEach((r) => {
          results[r.quizId || r.id] = r;
        });
        setResultsCache(results);
      })
      .catch(() => {
        try {
          setResultsCache(JSON.parse(localStorage.getItem('quiz_results_' + courseId) || "{}"));
        } catch {}
      });
  }, [courseId]);

  // Cache quizzes in localStorage as fallback
  useEffect(() => {
    if (quizzes.length > 0) {
      localStorage.setItem(COURSE_ID_KEY_PREFIX + courseId, JSON.stringify(quizzes));
    }
  }, [quizzes, courseId]);

  // === QUIZ BUILDER ===
  const addQuestion = () => {
    if (!newQuestion.text.trim()) return;
    setNewQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, { ...newQuestion, id: Date.now() }]
    }));
    setNewQuestion({ type: "multiple", text: "", options: ["", "", "", ""], correctAnswer: "", points: 10 });
  };

  const removeQuestion = (qId) => {
    setNewQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== qId)
    }));
  };

  const saveQuiz = async () => {
    if (!newQuiz.title || newQuiz.questions.length === 0) return;
    const quizData = { ...newQuiz, courseId };

    if (editingQuiz) {
      quizData.id = editingQuiz.id;
    }

    try {
      const saved = await api.createQuiz(quizData);
      if (editingQuiz) {
        setQuizzes(prev => prev.map(q => q.id === editingQuiz.id ? { ...saved, id: saved.id || editingQuiz.id } : q));
        setEditingQuiz(null);
      } else {
        setQuizzes(prev => [...prev, { ...saved, id: saved.id || Date.now(), createdAt: new Date().toLocaleDateString("id-ID") }]);
      }
    } catch {
      // Fallback to localStorage
      if (editingQuiz) {
        setQuizzes(prev => prev.map(q => q.id === editingQuiz.id ? { ...quizData, id: editingQuiz.id } : q));
        setEditingQuiz(null);
      } else {
        setQuizzes(prev => [...prev, { ...quizData, id: Date.now(), createdAt: new Date().toLocaleDateString("id-ID") }]);
      }
    }

    setNewQuiz({ title: "", description: "", duration: 30, questions: [] });
    setShowBuilder(false);
  };

  const deleteQuiz = (qId) => {
    setQuizzes(prev => prev.filter(q => q.id !== qId));
  };

  const editQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setNewQuiz({ title: quiz.title, description: quiz.description, duration: quiz.duration, questions: [...quiz.questions] });
    setShowBuilder(true);
  };

  // === TAKING QUIZ ===
  const startQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setUserAnswers({});
    setQuizResult(null);
  };

  const submitQuiz = async () => {
    let score = 0;
    let total = 0;
    const answers = {};
    const questions = activeQuiz.questions;
    questions.forEach((q) => {
      total += q.points;
      const userAns = (userAnswers[q.id] || "").toString().trim().toLowerCase();
      const correctAns = (q.correctAnswer || "").toString().trim().toLowerCase();
      answers[q.id] = { user: userAns, correct: correctAns };

      if (q.type === "multiple" || q.type === "truefalse") {
        if (userAns === correctAns) score += q.points;
      }
    });
    setQuizResult({ score, total, answers, questions, quizTitle: activeQuiz.title });

    // Submit to API
    try {
      const result = await api.submitQuiz(activeQuiz.id, { answers, score, total });
      setResultsCache(prev => ({ ...prev, [activeQuiz.id]: result }));
    } catch {
      // Local fallback
      const key = 'quiz_results_' + courseId;
      const results = JSON.parse(localStorage.getItem(key) || "{}");
      results[activeQuiz.id] = { score, total, answers, date: new Date().toLocaleString("id-ID") };
      localStorage.setItem(key, JSON.stringify(results));
    }
    setActiveQuiz(null);
  };

  const setOption = (qId, optIdx, value) => {
    setNewQuestion(prev => {
      if (prev.type !== "multiple") return prev;
      const opts = [...prev.options];
      opts[optIdx] = value;
      return { ...prev, options: opts };
    });
  };

  const percentage = (score, total) => Math.round((score / total) * 100);

  if (loading) {
    return <div className="text-center py-12"><span className="text-gray-400">Loading quizzes...</span></div>;
  }

  if (error) {
    return <div className="text-center py-12"><span className="text-red-400">Error: {error}</span></div>;
  }

  // Quiz Builder Modal
  if (showBuilder) {
    return (
      <div className="modal-overlay" onClick={() => setShowBuilder(false)}>
        <div className="modal-content max-w-3xl" onClick={e => e.stopPropagation()}>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">
            {editingQuiz ? "✏️ Edit Kuis" : "📝 Buat Kuis Baru"}
          </h3>
          <p className="text-gray-500 text-sm mb-6">Course ID: {courseId}</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Judul Kuis</label>
              <input type="text" value={newQuiz.title} onChange={e => setNewQuiz(p => ({ ...p, title: e.target.value }))}
                placeholder="Contoh: Ujian Tengah Semester"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (menit)</label>
              <input type="number" value={newQuiz.duration} onChange={e => setNewQuiz(p => ({ ...p, duration: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-purple-500" />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea value={newQuiz.description} onChange={e => setNewQuiz(p => ({ ...p, description: e.target.value }))}
              placeholder="Deskripsi atau instruksi kuis..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm h-20 focus:outline-none focus:border-purple-500" />
          </div>

          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 mb-2">📋 Soal ({newQuiz.questions.length})</h4>
            {newQuiz.questions.map((q, i) => (
              <div key={q.id} className="bg-gray-50 rounded-xl p-4 mb-2 flex justify-between items-start">
                <div className="flex-1">
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full mr-2">
                    {q.type === "multiple" ? "Pilihan Ganda" : q.type === "truefalse" ? "Benar/Salah" : "Essay"}
                  </span>
                  <span className="text-xs text-gray-400">{q.points} poin</span>
                  <p className="text-sm font-medium text-gray-700 mt-1">{q.text || "(Soal kosong)"}</p>
                  {q.type === "multiple" && (
                    <div className="text-xs text-gray-500 mt-1">
                      A. {q.options[0]} | B. {q.options[1]} | C. {q.options[2]} | D. {q.options[3]}
                    </div>
                  )}
                  <p className="text-xs text-green-600 mt-1">✅ Kunci: {q.correctAnswer}</p>
                </div>
                <button onClick={() => removeQuestion(q.id)} className="text-red-400 hover:text-red-600 text-sm ml-3">✕</button>
              </div>
            ))}
          </div>

          {/* Add Question */}
          <div className="bg-indigo-50 rounded-xl p-5 mb-6">
            <h4 className="font-semibold text-indigo-800 mb-3">➕ Tambah Soal</h4>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <select value={newQuestion.type} onChange={e => setNewQuestion(p => ({ ...p, type: e.target.value }))}
                className="px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:outline-none">
                <option value="multiple">Pilihan Ganda</option>
                <option value="truefalse">Benar/Salah</option>
                <option value="essay">Essay</option>
              </select>
              <input type="number" value={newQuestion.points} onChange={e => setNewQuestion(p => ({ ...p, points: Number(e.target.value) }))}
                placeholder="Poin" className="px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:outline-none" />
            </div>
            <textarea value={newQuestion.text} onChange={e => setNewQuestion(p => ({ ...p, text: e.target.value }))}
              placeholder="Tulis pertanyaan di sini..."
              className="w-full px-4 py-2.5 border border-indigo-200 rounded-xl text-sm h-20 mb-3 bg-white focus:outline-none" />

            {newQuestion.type === "multiple" && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {newQuestion.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="text-xs font-bold text-gray-500 w-5">{String.fromCharCode(65 + i)}.</span>
                    <input type="text" value={opt} onChange={e => setOption(null, i, e.target.value)}
                      placeholder={'Opsi ' + String.fromCharCode(65 + i)}
                      className="flex-1 px-3 py-1.5 border border-indigo-200 rounded-lg text-sm bg-white focus:outline-none" />
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kunci Jawaban</label>
                {newQuestion.type === "multiple" ? (
                  <select value={newQuestion.correctAnswer} onChange={e => setNewQuestion(p => ({ ...p, correctAnswer: e.target.value }))}
                    className="px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:outline-none">
                    <option value="">Pilih...</option>
                    <option value="a">A</option><option value="b">B</option>
                    <option value="c">C</option><option value="d">D</option>
                  </select>
                ) : newQuestion.type === "truefalse" ? (
                  <select value={newQuestion.correctAnswer} onChange={e => setNewQuestion(p => ({ ...p, correctAnswer: e.target.value }))}
                    className="px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:outline-none">
                    <option value="">Pilih...</option>
                    <option value="true">✅ Benar</option>
                    <option value="false">❌ Salah</option>
                  </select>
                ) : (
                  <input type="text" value={newQuestion.correctAnswer} onChange={e => setNewQuestion(p => ({ ...p, correctAnswer: e.target.value }))}
                    placeholder="Kata kunci jawaban" className="px-3 py-2 border border-indigo-200 rounded-lg text-sm bg-white focus:outline-none" />
                )}
              </div>
              <button onClick={addQuestion} className="self-end px-5 py-2 bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600">
                ➕ Tambah
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={saveQuiz} className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
              💾 {editingQuiz ? "Update Kuis" : "Simpan Kuis"}
            </button>
            <button onClick={() => { setShowBuilder(false); setEditingQuiz(null); setNewQuiz({ title: "", description: "", duration: 30, questions: [] }); }}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all">
              Batal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Result View
  if (quizResult) {
    const pct = percentage(quizResult.score, quizResult.total);
    return (
      <div>
        <div className={'text-center p-8 rounded-2xl mb-6 ' + (pct >= 70 ? "bg-green-50" : "bg-red-50")}>
          <span className="text-6xl">{pct >= 70 ? "🎉" : "📚"}</span>
          <h3 className="text-2xl font-bold text-gray-800 mt-3">
            {pct >= 70 ? "Kerja Bagus!" : "Terus Belajar!"}
          </h3>
          <div className="text-5xl font-bold mt-4" style={{ color: pct >= 70 ? "#16a34a" : "#dc2626" }}>
            {quizResult.score} / {quizResult.total}
          </div>
          <p className="text-lg text-gray-600 mt-2">Nilai: {pct}%</p>
          <button onClick={() => setQuizResult(null)} className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-colors">
            Kembali ke Daftar Kuis
          </button>
        </div>
        <div className="space-y-3">
          {Object.entries(quizResult.answers).map(([qId, ans], i) => {
            const q = quizResult.questions?.find(q => q.id === Number(qId));
            if (!q) return null;
            const isCorrect = ans.user === ans.correct;
            return (
              <div key={qId} className={'p-4 rounded-xl border ' + (isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">#{i + 1}</span>
                  <span className={'text-xs px-2 py-0.5 rounded-full ' + (isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                    {isCorrect ? "✅ Benar" : "❌ Salah"}
                  </span>
                  <span className="text-xs text-gray-400">{q.points} poin</span>
                </div>
                <p className="text-sm text-gray-700">{q.text}</p>
                <p className="text-xs mt-1">Jawabanmu: <strong className={isCorrect ? "text-green-600" : "text-red-600"}>{ans.user || "-"}</strong></p>
                {!isCorrect && <p className="text-xs text-green-600">Kunci: <strong>{ans.correct}</strong></p>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Active Quiz View (taking)
  if (activeQuiz) {
    return (
      <div>
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-6 mb-6">
          <h3 className="text-xl font-bold">{activeQuiz.title}</h3>
          <p className="text-white/70 text-sm mt-1">{activeQuiz.description}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-white/60">
            <span>📝 {activeQuiz.questions.length} soal</span>
            <span>⏱ {activeQuiz.duration} menit</span>
            <span>📊 Total {activeQuiz.questions.reduce((s, q) => s + q.points, 0)} poin</span>
          </div>
        </div>

        {activeQuiz.questions.map((q, i) => (
          <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                #{i + 1}
              </span>
              <span className="text-xs text-gray-400">{q.points} poin</span>
              {q.type === "essay" && <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full">Essay</span>}
            </div>
            <p className="text-gray-800 font-medium mb-3">{q.text}</p>

            {q.type === "multiple" && (
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <label key={oi} className={'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border ' + (
                    userAnswers[q.id] === String.fromCharCode(97 + oi)
                      ? "border-purple-400 bg-purple-50"
                      : "border-gray-200 hover:bg-gray-50"
                  )}>
                    <input type="radio" name={'q_' + q.id} value={String.fromCharCode(97 + oi)}
                      checked={userAnswers[q.id] === String.fromCharCode(97 + oi)}
                      onChange={e => setUserAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">{String.fromCharCode(65 + oi)}. {opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === "truefalse" && (
              <div className="flex gap-3">
                {["true", "false"].map(val => (
                  <label key={val} className={'flex-1 p-3 rounded-xl text-center cursor-pointer border font-medium transition-colors ' + (
                    userAnswers[q.id] === val ? "border-purple-400 bg-purple-50 text-purple-700" : "border-gray-200 hover:bg-gray-50 text-gray-600"
                  )}>
                    <input type="radio" name={'q_' + q.id} value={val}
                      checked={userAnswers[q.id] === val}
                      onChange={e => setUserAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      className="hidden" />
                    {val === "true" ? "✅ Benar" : "❌ Salah"}
                  </label>
                ))}
              </div>
            )}

            {q.type === "essay" && (
              <textarea value={userAnswers[q.id] || ""}
                onChange={e => setUserAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                placeholder="Tulis jawabanmu di sini..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm h-24 focus:outline-none focus:border-purple-400" />
            )}
          </div>
        ))}

        <button onClick={submitQuiz}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all mt-4">
          📤 Kumpulkan Kuis
        </button>
        <button onClick={() => { setActiveQuiz(null); setUserAnswers({}); }}
          className="w-full py-2 text-gray-400 text-sm mt-2 hover:text-gray-600">
          ← Keluar dari kuis
        </button>
      </div>
    );
  }

  // Main Quiz List View
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800">📝 Daftar Kuis</h3>
          <p className="text-sm text-gray-500">{quizzes.length} kuis tersedia</p>
        </div>
        {role === "lecturer" && (
          <button onClick={() => { setEditingQuiz(null); setNewQuiz({ title: "", description: "", duration: 30, questions: [] }); setShowBuilder(true); }}
            className="px-5 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-colors">
            ➕ Buat Kuis
          </button>
        )}
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <span className="text-5xl">📝</span>
          <p className="text-gray-500 mt-3">
            {role === "lecturer" ? "Belum ada kuis. Klik 'Buat Kuis' untuk mulai!" : "Belum ada kuis tersedia."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {quizzes.map(quiz => {
            const myResult = resultsCache[quiz.id];
            return (
              <div key={quiz.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 text-lg">{quiz.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{quiz.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                      <span>📝 {quiz.questions.length} soal</span>
                      <span>⏱ {quiz.duration} menit</span>
                      <span>📅 {quiz.createdAt}</span>
                    </div>
                    {myResult && (
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                        <span className="text-sm font-bold text-green-700">
                          Nilai: {myResult.score}/{myResult.total} ({percentage(myResult.score, myResult.total)}%)
                        </span>
                        <span className="text-xs text-green-500">{myResult.date}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {role === "student" && (
                      <button onClick={() => startQuiz(quiz)}
                        className="px-5 py-2.5 bg-purple-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-600 transition-colors">
                        {myResult ? "🔄 Ulangi" : "▶ Mulai"}
                      </button>
                    )}
                    {role === "lecturer" && (
                      <>
                        <button onClick={() => editQuiz(quiz)}
                          className="px-3 py-2 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                          ✏️ Edit
                        </button>
                        <button onClick={() => deleteQuiz(quiz.id)}
                          className="px-3 py-2 text-xs bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors">
                          🗑 Hapus
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lecturer: View submissions */}
      {role === "lecturer" && quizzes.length > 0 && (
        <div className="mt-8 p-5 bg-gray-50 rounded-2xl">
          <h4 className="font-semibold text-gray-700 mb-3">📊 Ringkasan Hasil Kuis</h4>
          {quizzes.map(quiz => {
            const quizResults = Object.entries(resultsCache).filter(([id]) => Number(id) === quiz.id);
            return (
              <div key={quiz.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                <span className="text-sm text-gray-600">{quiz.title}</span>
                <span className="text-sm text-gray-400">{quizResults.length} siswa mengerjakan</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
