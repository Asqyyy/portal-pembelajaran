import { useState, useEffect } from "react";
import { api } from "../api/client";

export default function CalendarWidget({ courseId, role }) {
  const [currentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", type: "deadline", color: "purple" });

  // Load events from API
  useEffect(() => {
    setLoading(true);
    setError("");
    api.getCourse(courseId)
      .then((data) => {
        const apiEvents = data.calendarEvents || data.events || [];
        setEvents(apiEvents);
      })
      .catch(() => {
        setError("Gagal memuat kalender.");
        // Fallback to localStorage
        try {
          setEvents(JSON.parse(localStorage.getItem('calendar_' + courseId) || "[]"));
        } catch { setEvents([]); }
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  // Cache in localStorage
  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem('calendar_' + courseId, JSON.stringify(events));
    }
  }, [events, courseId]);

  // Auto-collect deadlines from quizzes & assignments
  useEffect(() => {
    const fetchAutoEvents = async () => {
      try {
        const quizData = await api.getQuizByCourse(courseId);
        const quizzes = Array.isArray(quizData) ? quizData : (quizData.quizzes || []);
        const courseData = await api.getCourse(courseId);
        const assignments = courseData.assignments || [];
        const autoEvents = [];

        quizzes.forEach(q => {
          if (q.deadline && !events.find(e => e.sourceId === 'quiz_' + q.id)) {
            autoEvents.push({
              id: 'auto_quiz_' + q.id, sourceId: 'quiz_' + q.id,
              title: '📝 ' + q.title,
              date: q.deadline, type: "quiz", color: "purple", isAuto: true
            });
          }
        });
        assignments.forEach(a => {
          if (a.deadline && !events.find(e => e.sourceId === 'asg_' + a.id)) {
            autoEvents.push({
              id: 'auto_asg_' + a.id, sourceId: 'asg_' + a.id,
              title: '📤 ' + a.title,
              date: a.deadline, type: "assignment", color: "blue", isAuto: true
            });
          }
        });
        if (autoEvents.length > 0) {
          setEvents(prev => {
            const existing = new Set(prev.map(e => e.id));
            return [...prev, ...autoEvents.filter(e => !existing.has(e.id))];
          });
        }
      } catch {}
    };
    fetchAutoEvents();
  }, [courseId]);

  const addEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.date) return;
    const eventData = {
      id: Date.now(),
      ...newEvent,
      isAuto: false,
      courseId,
      createdAt: new Date().toLocaleDateString("id-ID")
    };
    const updated = [...events, eventData];
    setEvents(updated);
    setNewEvent({ title: "", date: "", type: "deadline", color: "purple" });
    setShowAddEvent(false);

    // Save to API
    try {
      await api.updateCourse(courseId, { calendarEvents: updated });
    } catch {}
  };

  const removeEvent = (eventId) => {
    const updated = events.filter(e => e.id !== eventId);
    setEvents(updated);
    try { api.updateCourse(courseId, { calendarEvents: updated }); } catch {}
  };

  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
  const today = new Date();

  const isToday = (day) => {
    return today.getDate() === day && today.getMonth() === selectedMonth && today.getFullYear() === selectedYear;
  };

  const getEventsForDay = (day) => {
    return events.filter(e => {
      const eDate = new Date(e.date);
      return eDate.getDate() === day && eDate.getMonth() === selectedMonth && eDate.getFullYear() === selectedYear;
    });
  };

  const colorMap = {
    purple: "bg-purple-500", blue: "bg-blue-500", red: "bg-red-500",
    green: "bg-green-500", orange: "bg-orange-500",
  };

  const typeLabels = {
    deadline: "⏰ Tenggat", quiz: "📝 Kuis", assignment: "📤 Tugas",
    event: "📅 Event", exam: "📋 Ujian",
  };

  const upcoming = events
    .filter(e => {
      const eDate = new Date(e.date);
      const diff = Math.ceil((eDate - today) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 7;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (loading) {
    return <div className="text-center py-12"><span className="text-gray-400">Loading calendar...</span></div>;
  }

  if (error) {
    return <div className="text-center py-12"><span className="text-red-400">Error: {error}</span></div>;
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              {months[selectedMonth]} {selectedYear}
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={() => {
                if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(prev => prev - 1); }
                else setSelectedMonth(prev => prev - 1);
              }} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm transition-colors">
                ←
              </button>
              <button onClick={() => { setSelectedMonth(today.getMonth()); setSelectedYear(today.getFullYear()); }}
                className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium">
                Hari Ini
              </button>
              <button onClick={() => {
                if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(prev => prev + 1); }
                else setSelectedMonth(prev => prev + 1);
              }} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm transition-colors">
                →
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(d => (
                <div key={d} className="text-center py-2.5 text-xs font-semibold text-gray-500">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={'empty-' + i} className="h-20 p-1 border-r border-b border-gray-100 bg-gray-50/50" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEvents = getEventsForDay(day);
                return (
                  <div key={day} className={'h-20 p-1 border-r border-b border-gray-100 relative ' + (
                    isToday(day) ? "bg-purple-50/50" : ""
                  )}>
                    <span className={'text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full ' + (
                      isToday(day) ? "bg-purple-500 text-white" : "text-gray-600"
                    )}>
                      {day}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {dayEvents.slice(0, 2).map((ev, ix) => (
                        <div key={ix} className={'w-1.5 h-1.5 rounded-full mx-auto ' + (colorMap[ev.color] || "bg-gray-400")} title={ev.title} />
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[9px] text-gray-400 text-center">+{dayEvents.length - 2}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div>
          {role === "lecturer" && (
            <button onClick={() => setShowAddEvent(!showAddEvent)}
              className="w-full px-4 py-3 bg-purple-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-600 transition-colors mb-4">
              ➕ Tambah Event
            </button>
          )}

          {showAddEvent && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
              <h4 className="font-semibold text-gray-700 text-sm mb-3">Event Baru</h4>
              <input type="text" value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))}
                placeholder="Judul event" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2 focus:outline-none focus:border-purple-400" />
              <input type="date" value={newEvent.date} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2 focus:outline-none focus:border-purple-400" />
              <div className="flex gap-2 mb-3">
                <select value={newEvent.type} onChange={e => setNewEvent(p => ({ ...p, type: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <select value={newEvent.color} onChange={e => setNewEvent(p => ({ ...p, color: e.target.value }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
                  {Object.entries(colorMap).map(([k]) => (
                    <option key={k} value={k}>{k === "purple" ? "🟣" : k === "blue" ? "🔵" : k === "red" ? "🔴" : k === "green" ? "🟢" : "🟠"} {k}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={addEvent} className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">Simpan</button>
                <button onClick={() => setShowAddEvent(false)} className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-300">Batal</button>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <h4 className="font-semibold text-gray-700 text-sm mb-3">⏰ 7 Hari ke Depan</h4>
            {upcoming.length === 0 ? (
              <p className="text-xs text-gray-400">Tidak ada deadline mendatang 🎉</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map(ev => {
                  const eDate = new Date(ev.date);
                  const diff = Math.ceil((eDate - today) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={ev.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={'w-2 h-2 rounded-full flex-shrink-0 ' + (colorMap[ev.color] || "bg-gray-400")} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{ev.title}</p>
                        <p className="text-xs text-gray-400">
                          {eDate.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                          {diff === 0 ? " • Hari ini!" : diff === 1 ? " • Besok!" : ' • ' + diff + ' hari lagi'}
                        </p>
                      </div>
                      {role === "lecturer" && (
                        <button onClick={() => removeEvent(ev.id)} className="text-xs text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 mt-4">
            <h4 className="font-semibold text-gray-700 text-sm mb-3">📋 Semua Event</h4>
            {events.length === 0 ? (
              <p className="text-xs text-gray-400">Belum ada event</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {events.sort((a, b) => new Date(a.date) - new Date(b.date)).map(ev => (
                  <div key={ev.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-gray-50">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={'w-1.5 h-1.5 rounded-full flex-shrink-0 ' + (colorMap[ev.color] || "bg-gray-400")} />
                      <span className="text-gray-600 truncate">{ev.title}</span>
                    </div>
                    <span className="text-gray-400 flex-shrink-0 ml-2">
                      {new Date(ev.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
