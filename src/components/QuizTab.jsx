import { useState, useEffect, useRef } from "react";

/* ─── helpers ─────────────────────────────── */
const QUIZZES_KEY = (cid) => `quizzes_${cid}`;
const RESULTS_KEY = (cid) => `quiz_results_${cid}`;

const load = (key, fallback = []) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

const EMPTY_Q = () => ({
  id: Date.now(), type: "mc",
  text: "", options: ["", "", "", ""], answer: "A", points: 10,
});

const gradeSubmission = (quiz, answers) => {
  let score = 0;
  quiz.questions.forEach((q) => {
    if (q.type === "essay") return;
    const given = answers[q.id];
    if (q.type === "mc"   && given === q.answer) score += q.points;
    if (q.type === "tf"   && given === q.answer) score += q.points;
  });
  return score;
};

const maxScore = (quiz) =>
  quiz.questions.reduce((s, q) => s + (q.type === "essay" ? 0 : q.points), 0);

/* ═══════════════════════════════════════════
   QUIZ BUILDER  (lecturer)
═══════════════════════════════════════════ */
function QuizBuilder({ courseId, initial, onSave, onCancel }) {
  const [title,    setTitle]    = useState(initial?.title    ?? "");
  const [duration, setDuration] = useState(initial?.duration ?? 30);
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [questions, setQs]      = useState(initial?.questions ?? [EMPTY_Q()]);

  const addQ = (type) => setQs([...questions, { ...EMPTY_Q(), id: Date.now(), type }]);
  const removeQ = (id) => setQs(questions.filter((q) => q.id !== id));
  const updateQ = (id, patch) =>
    setQs(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const updateOption = (qid, idx, val) =>
    setQs(questions.map((q) =>
      q.id === qid ? { ...q, options: q.options.map((o, i) => i === idx ? val : o) } : q));

  const handleSave = (published) => {
    if (!title.trim()) return alert("Masukkan judul kuis.");
    if (questions.length === 0) return alert("Tambahkan minimal 1 soal.");
    onSave({
      id: initial?.id ?? Date.now(),
      title, duration: Number(duration), deadline, published,
      questions: questions.map((q, idx) => ({ ...q, no: idx + 1 })),
    });
  };

  return (
    <div className="quiz-builder">
      <div className="quiz-builder-header">
        <h3 className="quiz-builder-title">
          {initial ? "✏️ Edit Kuis" : "🧩 Buat Kuis Baru"}
        </h3>
        <button onClick={onCancel} className="qb-close-btn">✕</button>
      </div>

      {/* Meta */}
      <div className="qb-meta">
        <div className="qb-field">
          <label className="qb-label">Judul Kuis</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            className="qb-input" placeholder="Contoh: Kuis Bab 1 — Statistika" />
        </div>
        <div className="qb-field">
          <label className="qb-label">Durasi (menit)</label>
          <input type="number" min={1} max={300} value={duration}
            onChange={(e) => setDuration(e.target.value)} className="qb-input" style={{width:100}} />
        </div>
        <div className="qb-field">
          <label className="qb-label">Deadline</label>
          <input type="datetime-local" value={deadline}
            onChange={(e) => setDeadline(e.target.value)} className="qb-input" />
        </div>
      </div>

      {/* Questions */}
      <div className="qb-questions">
        {questions.map((q, idx) => (
          <div key={q.id} className="qb-question-card">
            <div className="qb-question-header">
              <span className="qb-q-no">Soal {idx + 1}</span>
              <select value={q.type} onChange={(e) => updateQ(q.id, { type: e.target.value })}
                className="qb-type-select">
                <option value="mc">Pilihan Ganda</option>
                <option value="tf">Benar / Salah</option>
                <option value="essay">Essay</option>
              </select>
              <input type="number" min={1} value={q.points}
                onChange={(e) => updateQ(q.id, { points: Number(e.target.value) })}
                className="qb-points" title="Poin" />
              <span className="qb-points-label">poin</span>
              <button onClick={() => removeQ(q.id)} className="qb-remove-btn" title="Hapus soal">🗑</button>
            </div>

            <textarea value={q.text} rows={2} placeholder="Tulis pertanyaan di sini..."
              onChange={(e) => updateQ(q.id, { text: e.target.value })}
              className="qb-question-text" />

            {/* MC */}
            {q.type === "mc" && (
              <div className="qb-options">
                {["A","B","C","D"].map((ltr, i) => (
                  <div key={ltr} className="qb-option-row">
                    <label className={`qb-option-lbl ${q.answer === ltr ? "qb-answer-sel" : ""}`}>
                      <input type="radio" name={`ans_${q.id}`} checked={q.answer === ltr}
                        onChange={() => updateQ(q.id, { answer: ltr })} />
                      {ltr}
                    </label>
                    <input value={q.options[i] ?? ""}
                      onChange={(e) => updateOption(q.id, i, e.target.value)}
                      placeholder={`Opsi ${ltr}...`} className="qb-option-input" />
                  </div>
                ))}
                <p className="qb-hint">● Pilih radio = kunci jawaban</p>
              </div>
            )}

            {/* TF */}
            {q.type === "tf" && (
              <div className="qb-tf-row">
                {["Benar","Salah"].map((opt) => (
                  <label key={opt} className={`qb-tf-option ${q.answer === opt ? "qb-answer-sel" : ""}`}>
                    <input type="radio" name={`tf_${q.id}`} checked={q.answer === opt}
                      onChange={() => updateQ(q.id, { answer: opt })} />
                    {opt === "Benar" ? "✅ Benar" : "❌ Salah"}
                  </label>
                ))}
              </div>
            )}

            {/* Essay */}
            {q.type === "essay" && (
              <p className="qb-essay-hint">📝 Essay — dinilai manual oleh pengajar</p>
            )}
          </div>
        ))}
      </div>

      {/* Add buttons */}
      <div className="qb-add-row">
        <button onClick={() => addQ("mc")}    className="qb-add-btn">＋ Pilihan Ganda</button>
        <button onClick={() => addQ("tf")}    className="qb-add-btn">＋ Benar/Salah</button>
        <button onClick={() => addQ("essay")} className="qb-add-btn">＋ Essay</button>
      </div>

      {/* Save */}
      <div className="qb-save-row">
        <button onClick={() => handleSave(false)} className="qb-draft-btn">💾 Simpan Draft</button>
        <button onClick={() => handleSave(true)}  className="qb-publish-btn">🚀 Publish Kuis</button>
        <button onClick={onCancel} className="cd-btn-cancel">Batal</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   QUIZ TAKER  (student)
═══════════════════════════════════════════ */
function QuizTaker({ quiz, courseId, onDone, user }) {
  const [answers, setAnswers]   = useState({});
  const [timeLeft, setTimeLeft] = useState(quiz.duration * 60);
  const [submitted, setSubmit]  = useState(false);
  const [result, setResult]     = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleSubmit = (auto = false) => {
    if (!auto && !confirm("Yakin ingin submit? Jawaban tidak bisa diubah.")) return;
    clearInterval(timerRef.current);
    const score = gradeSubmission(quiz, answers);
    const mx    = maxScore(quiz);
    const result = {
      quizId: quiz.id, student: user?.username ?? "Kamu",
      answers, score, maxScore: mx,
      submittedAt: new Date().toLocaleString("id-ID"),
      essayGrades: {},
    };
    const all = load(RESULTS_KEY(courseId));
    save(RESULTS_KEY(courseId), [...all, result]);
    setResult(result); setSubmit(true);
  };

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const pct = result ? Math.round((result.score / result.maxScore) * 100) || 0 : 0;

  if (submitted && result) {
    return (
      <div className="quiz-result">
        <div className="qr-result-header">
          <span className="qr-result-emoji">{pct >= 75 ? "🎉" : pct >= 50 ? "😊" : "💪"}</span>
          <h3 className="qr-result-title">Kuis Selesai!</h3>
          <p className="qr-result-sub">{quiz.title}</p>
        </div>
        <div className="qr-result-score-wrap">
          <div className="qr-result-score">{result.score}<span>/{result.maxScore}</span></div>
          <div className="qr-result-pct">{pct}%</div>
          <div className={`qr-result-grade ${pct>=75?"grade-good":pct>=50?"grade-mid":"grade-low"}`}>
            {pct>=90?"A":pct>=80?"B+":pct>=75?"B":pct>=65?"C+":pct>=60?"C":pct>=50?"D":"E"}
          </div>
        </div>

        {/* Per question review */}
        <div className="qr-review">
          {quiz.questions.map((q, i) => {
            const given  = answers[q.id];
            const correct = q.type !== "essay" && given === q.answer;
            return (
              <div key={q.id} className={`qr-review-item ${q.type==="essay"?"essay-item":correct?"correct-item":"wrong-item"}`}>
                <div className="qr-review-q">
                  <span className="qr-review-no">Soal {i+1}</span>
                  <span className={`qr-review-badge ${q.type==="essay"?"badge-essay":correct?"badge-correct":"badge-wrong"}`}>
                    {q.type==="essay" ? "📝 Perlu dinilai" : correct ? "✅ Benar" : "❌ Salah"}
                  </span>
                </div>
                <p className="qr-review-text">{q.text}</p>
                {q.type !== "essay" && (
                  <p className="qr-review-ans">
                    Jawabanmu: <strong>{given ?? "–"}</strong>
                    {!correct && <span className="qr-review-correct"> · Jawaban benar: <strong>{q.answer}</strong></span>}
                  </p>
                )}
                {q.type === "essay" && <p className="qr-review-ans">Jawabanmu: {given ?? <em>(kosong)</em>}</p>}
              </div>
            );
          })}
        </div>

        <button onClick={onDone} className="quiz-back-btn">← Kembali ke Daftar Kuis</button>
      </div>
    );
  }

  return (
    <div className="quiz-taker">
      <div className="qt-header">
        <div>
          <h3 className="qt-title">{quiz.title}</h3>
          <p className="qt-meta">{quiz.questions.length} soal · {quiz.duration} menit</p>
        </div>
        <div className={`qt-timer ${timeLeft < 60 ? "qt-timer-urgent" : ""}`}>
          ⏱ {fmt(timeLeft)}
        </div>
      </div>

      <div className="qt-questions">
        {quiz.questions.map((q, i) => (
          <div key={q.id} className="qt-q-card">
            <div className="qt-q-header">
              <span className="qt-q-no">Soal {i+1}</span>
              <span className="qt-q-pts">{q.points} poin</span>
            </div>
            <p className="qt-q-text">{q.text || <em className="text-gray-400">Pertanyaan belum diisi.</em>}</p>

            {q.type === "mc" && (
              <div className="qt-mc-options">
                {["A","B","C","D"].map((ltr, idx) => (
                  <label key={ltr} className={`qt-mc-option ${answers[q.id]===ltr?"qt-mc-selected":""}`}>
                    <input type="radio" name={`q_${q.id}`} value={ltr}
                      checked={answers[q.id]===ltr}
                      onChange={() => setAnswers({...answers,[q.id]:ltr})} />
                    <span className="qt-mc-ltr">{ltr}</span>
                    <span>{q.options[idx] || `Opsi ${ltr}`}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === "tf" && (
              <div className="qt-tf-options">
                {["Benar","Salah"].map((opt) => (
                  <label key={opt} className={`qt-tf-option ${answers[q.id]===opt?"qt-mc-selected":""}`}>
                    <input type="radio" name={`q_${q.id}`} value={opt}
                      checked={answers[q.id]===opt}
                      onChange={() => setAnswers({...answers,[q.id]:opt})} />
                    {opt==="Benar"?"✅ Benar":"❌ Salah"}
                  </label>
                ))}
              </div>
            )}

            {q.type === "essay" && (
              <textarea rows={4} placeholder="Tulis jawabanmu di sini..."
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers({...answers,[q.id]:e.target.value})}
                className="qt-essay-input" />
            )}
          </div>
        ))}
      </div>

      <div className="qt-footer">
        <button onClick={() => handleSubmit(false)} className="quiz-submit-btn">
          ✅ Submit Kuis
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ESSAY GRADER  (lecturer)
═══════════════════════════════════════════ */
function EssayGrader({ quiz, courseId, onClose }) {
  const [results, setResults] = useState(() => load(RESULTS_KEY(courseId)));
  const myResults = results.filter((r) => r.quizId === quiz.id);
  const essayQs   = quiz.questions.filter((q) => q.type === "essay");

  const setEssayGrade = (resultIdx, qId, grade) => {
    const globalIdx = results.findIndex(
      (r) => r.quizId === quiz.id && results.filter((x) => x.quizId === quiz.id).indexOf(r) === resultIdx
    );
    if (globalIdx < 0) return;
    const updated = [...results];
    updated[globalIdx] = {
      ...updated[globalIdx],
      essayGrades: { ...updated[globalIdx].essayGrades, [qId]: Number(grade) },
      score: gradeSubmission(quiz, updated[globalIdx].answers) +
        Object.entries({ ...updated[globalIdx].essayGrades, [qId]: Number(grade) })
          .reduce((s,[k,v]) => s + (quiz.questions.find(q=>String(q.id)===k)?.points > 0 ? v : 0), 0),
    };
    setResults(updated);
    save(RESULTS_KEY(courseId), updated);
  };

  if (myResults.length === 0) return (
    <div className="essay-grader">
      <div className="quiz-panel-header"><h3>Nilai Essay — {quiz.title}</h3><button onClick={onClose}>✕</button></div>
      <p className="text-gray-500 py-8 text-center">Belum ada submission.</p>
    </div>
  );

  return (
    <div className="essay-grader">
      <div className="quiz-panel-header">
        <h3 className="qp-title">📝 Nilai Essay — {quiz.title}</h3>
        <button onClick={onClose} className="qb-close-btn">✕</button>
      </div>
      {myResults.map((res, ri) => (
        <div key={ri} className="eg-student-block">
          <div className="eg-student-header">
            <span className="eg-avatar">{res.student.charAt(0).toUpperCase()}</span>
            <div>
              <span className="eg-student-name">{res.student}</span>
              <span className="eg-submitted">Submit: {res.submittedAt}</span>
            </div>
            <span className="eg-score">{res.score}/{res.maxScore}</span>
          </div>
          {essayQs.map((q) => (
            <div key={q.id} className="eg-q-block">
              <p className="eg-q-text"><strong>Soal:</strong> {q.text}</p>
              <p className="eg-q-answer"><strong>Jawaban:</strong> {res.answers[q.id] || <em>Kosong</em>}</p>
              <div className="eg-grade-row">
                <label className="eg-grade-label">Nilai ({q.points} maks):</label>
                <input type="number" min={0} max={q.points}
                  value={res.essayGrades?.[q.id] ?? ""}
                  onChange={(e) => setEssayGrade(ri, q.id, e.target.value)}
                  className="eg-grade-input" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN QUIZ TAB
═══════════════════════════════════════════ */
export default function QuizTab({ courseId, role, user }) {
  const [quizzes, setQuizzes]   = useState(() => load(QUIZZES_KEY(courseId)));
  const [view,    setView]      = useState("list"); // list | builder | taker | grader
  const [editing, setEditing]   = useState(null);
  const [active,  setActive]    = useState(null);   // quiz being taken/graded
  const results = load(RESULTS_KEY(courseId));

  const saveQuiz = (quiz) => {
    const all = quizzes.find((q) => q.id === quiz.id)
      ? quizzes.map((q) => (q.id === quiz.id ? quiz : q))
      : [...quizzes, quiz];
    setQuizzes(all); save(QUIZZES_KEY(courseId), all); setView("list");
  };

  const deleteQuiz = (id) => {
    if (!confirm("Hapus kuis ini?")) return;
    const all = quizzes.filter((q) => q.id !== id);
    setQuizzes(all); save(QUIZZES_KEY(courseId), all);
  };

  const togglePublish = (quiz) => {
    saveQuiz({ ...quiz, published: !quiz.published });
  };

  const myResult = (quiz) =>
    results.find((r) => r.quizId === quiz.id && r.student === (user?.username ?? "Kamu"));

  const submissionCount = (quiz) =>
    results.filter((r) => r.quizId === quiz.id).length;

  if (view === "builder") return (
    <QuizBuilder courseId={courseId} initial={editing}
      onSave={saveQuiz} onCancel={() => setView("list")} />
  );
  if (view === "taker" && active) return (
    <QuizTaker quiz={active} courseId={courseId} user={user}
      onDone={() => { setActive(null); setView("list"); }} />
  );
  if (view === "grader" && active) return (
    <EssayGrader quiz={active} courseId={courseId}
      onClose={() => { setActive(null); setView("list"); }} />
  );

  const visibleQuizzes = role === "lecturer" ? quizzes : quizzes.filter((q) => q.published);

  return (
    <div className="quiz-tab">
      {/* Header */}
      <div className="quiz-tab-header">
        <div>
          <h3 className="quiz-tab-title">🧩 Daftar Kuis</h3>
          <p className="quiz-tab-sub">{visibleQuizzes.length} kuis tersedia</p>
        </div>
        {role === "lecturer" && (
          <button onClick={() => { setEditing(null); setView("builder"); }} className="quiz-create-btn" id="create-quiz-btn">
            ＋ Buat Kuis Baru
          </button>
        )}
      </div>

      {/* List */}
      {visibleQuizzes.length === 0 ? (
        <div className="quiz-empty">
          <div className="quiz-empty-icon">🧩</div>
          <p className="quiz-empty-title">Belum ada kuis</p>
          <p className="quiz-empty-sub">
            {role === "lecturer" ? "Klik \"Buat Kuis Baru\" untuk mulai." : "Pengajar belum membuat kuis."}
          </p>
        </div>
      ) : (
        <div className="quiz-list">
          {visibleQuizzes.map((quiz) => {
            const res = myResult(quiz);
            const overdue = quiz.deadline && new Date(quiz.deadline) < new Date();
            const subs = submissionCount(quiz);
            return (
              <div key={quiz.id} className={`quiz-card ${!quiz.published ? "quiz-card-draft" : ""}`}>
                <div className="quiz-card-left">
                  <div className="quiz-card-icon">🧩</div>
                  <div>
                    <div className="quiz-card-title-row">
                      <h4 className="quiz-card-title">{quiz.title}</h4>
                      {!quiz.published && <span className="quiz-draft-badge">Draft</span>}
                      {quiz.published && !res && !overdue && <span className="quiz-open-badge">Tersedia</span>}
                      {res && <span className="quiz-done-badge">✅ Selesai</span>}
                      {overdue && !res && role==="student" && <span className="quiz-closed-badge">Tutup</span>}
                    </div>
                    <div className="quiz-card-meta">
                      <span>⏱ {quiz.duration} menit</span>
                      <span>🧮 {quiz.questions.length} soal</span>
                      {quiz.deadline && (
                        <span className={overdue ? "text-red-400" : ""}>
                          📅 {new Date(quiz.deadline).toLocaleDateString("id-ID")}
                        </span>
                      )}
                      {role === "lecturer" && <span>👥 {subs} submission</span>}
                    </div>
                    {res && role === "student" && (
                      <div className="quiz-result-mini">
                        Nilaimu: <strong>{res.score}/{res.maxScore}</strong>
                        <span className="quiz-pct"> ({Math.round((res.score/res.maxScore)*100)||0}%)</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="quiz-card-actions">
                  {role === "lecturer" && (
                    <>
                      <button onClick={() => { setEditing(quiz); setView("builder"); }} className="quiz-act-btn quiz-act-edit">✏️ Edit</button>
                      <button onClick={() => togglePublish(quiz)} className={`quiz-act-btn ${quiz.published?"quiz-act-unpublish":"quiz-act-publish"}`}>
                        {quiz.published ? "📥 Unpublish" : "🚀 Publish"}
                      </button>
                      {quiz.questions.some((q) => q.type === "essay") && subs > 0 && (
                        <button onClick={() => { setActive(quiz); setView("grader"); }} className="quiz-act-btn quiz-act-grade">📝 Nilai Essay</button>
                      )}
                      <button onClick={() => deleteQuiz(quiz.id)} className="quiz-act-btn quiz-act-delete">🗑</button>
                    </>
                  )}
                  {role === "student" && !res && !overdue && quiz.published && (
                    <button onClick={() => { setActive(quiz); setView("taker"); }} className="quiz-start-btn" id={`start-quiz-${quiz.id}`}>
                      ▶ Mulai Kuis
                    </button>
                  )}
                  {role === "student" && res && (
                    <span className="quiz-score-badge">{res.score}/{res.maxScore}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
