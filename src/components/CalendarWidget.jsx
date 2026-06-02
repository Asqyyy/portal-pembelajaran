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
  const [newEvent, setNewEvent] = useState({ title: "", description: "", date: "", type: "general", color: "purple" });
  const [success, setSuccess] = useState("");

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const loadEvents = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getCalendarEvents(courseId);
      setEvents(data);
    } catch (err) {
      setError("Gagal memuat kalender: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [courseId]);

  const handleAddEvent = async (e) => {
    e.preventDefault();
    setError("");
    if (!newEvent.title.trim() || !newEvent.date) return;

    try {
      await api.createCalendarEvent({
        course_id: courseId,
        title: newEvent.title,
        description: newEvent.description,
        event_date: newEvent.date,
        event_type: newEvent.type,
        color: newEvent.color
      });
      setSuccess("Event kalender berhasil ditambahkan!");
      setShowAddEvent(false);
      setNewEvent({ title: "", description: "", date: "", type: "general", color: "purple" });
      loadEvents();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Gagal menambahkan event: " + (err.message || err));
    }
  };

  const handleRemoveEvent = async (eventId) => {
    if (!confirm("Apakah Anda yakin ingin menghapus event ini?")) return;
    setError("");
    try {
      await api.deleteCalendarEvent(eventId);
      setSuccess("Event kalender berhasil dihapus!");
      loadEvents();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Gagal menghapus event: " + (err.message || err));
    }
  };

  // Generate calendar days
  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
  
  const daysArray = [];
  // Fill empty spaces before first day of month
  for (let i = 0; i < firstDay; i++) {
    daysArray.push(null);
  }
  // Fill month days
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  const getEventsForDate = (day) => {
    if (!day) return [];
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter(e => e.date === dateStr);
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  // Get upcoming 7 days events
  const getUpcomingEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limit = new Date(today);
    limit.setDate(limit.getDate() + 7);

    return events.filter(e => {
      const eDate = new Date(e.date);
      eDate.setHours(0, 0, 0, 0);
      return eDate >= today && eDate <= limit;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const colorMap = {
    purple: "bg-purple-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500"
  };

  const colorBorderMap = {
    purple: "border-purple-200 bg-purple-50 text-purple-700",
    red: "border-red-200 bg-red-50 text-red-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-green-200 bg-green-50 text-green-700",
    yellow: "border-yellow-200 bg-yellow-50 text-yellow-700"
  };

  const isLecturer = role === "lecturer" || role === "admin";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 text-lg">📅 JADWAL & KALENDER KELAS</h3>
        {isLecturer && (
          <button
            onClick={() => setShowAddEvent(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all"
          >
            ➕ Tambah Event
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
        <p className="text-center py-6 text-gray-400">Memuat data kalender...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Grid Calendar */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-gray-700 text-base">
                {monthNames[selectedMonth]} {selectedYear}
              </h4>
              <div className="flex gap-1">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl text-sm font-semibold">◀</button>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-xl text-sm font-semibold">▶</button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-gray-400 mb-2">
              {dayNames.map(d => <div key={d} className="py-2">{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {daysArray.map((day, idx) => {
                const dateEvents = getEventsForDate(day);
                const isToday = day && 
                                currentDate.getDate() === day && 
                                currentDate.getMonth() === selectedMonth && 
                                currentDate.getFullYear() === selectedYear;

                return (
                  <div
                    key={idx}
                    className={`min-h-[70px] p-1 border border-gray-100 rounded-xl flex flex-col justify-between ${
                      day ? "bg-white" : "bg-gray-50/50"
                    } ${isToday ? "ring-2 ring-indigo-500" : ""}`}
                  >
                    {day ? (
                      <>
                        <span className={`text-xs font-semibold block text-left p-1 ${
                          isToday ? "text-indigo-600 font-extrabold" : "text-gray-500"
                        }`}>{day}</span>
                        
                        <div className="space-y-1">
                          {dateEvents.slice(0, 2).map((ev) => (
                            <div
                              key={ev.id}
                              className={`text-[9px] px-1 py-0.5 rounded truncate text-left border ${
                                colorBorderMap[ev.color || "purple"]
                              }`}
                              title={`${ev.title}\n${ev.description || ""}`}
                            >
                              {ev.title}
                            </div>
                          ))}
                          {dateEvents.length > 2 && (
                            <span className="text-[8px] text-gray-400 font-medium block text-left pl-1">
                              +{dateEvents.length - 2} lainnya
                            </span>
                          )}
                        </div>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar Deadlines & events */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h4 className="font-bold text-gray-700 text-sm mb-3">📅 Event 7 Hari Terdekat</h4>
              {getUpcomingEvents().length === 0 ? (
                <p className="text-xs text-gray-400">Tidak ada event dalam 7 hari terdekat.</p>
              ) : (
                <div className="space-y-3">
                  {getUpcomingEvents().map(ev => {
                    const daysLeft = Math.ceil((new Date(ev.date) - currentDate) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div key={ev.id} className="flex justify-between items-start gap-2 p-3 bg-gray-50 rounded-xl border border-gray-150">
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 text-xs truncate">{ev.title}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(ev.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} 
                            {daysLeft === 0 ? " (Hari ini)" : daysLeft === 1 ? " (Besok)" : ` (${daysLeft} hari lagi)`}
                          </p>
                        </div>
                        {isLecturer && ev.createdBy && (
                          <button
                            onClick={() => handleRemoveEvent(ev.id)}
                            className="text-gray-400 hover:text-red-500 text-xs p-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="modal-overlay" onClick={() => setShowAddEvent(false)}>
          <form
            onSubmit={handleAddEvent}
            className="modal-content max-w-sm space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-800">➕ Tambah Event Kalender</h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Judul Event</label>
              <input
                type="text"
                required
                placeholder="Rapat, Kuis dadakan, UTS..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Keterangan / Deskripsi</label>
              <textarea
                placeholder="Detail event..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Tanggal Event</label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none text-sm"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Tipe</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none text-xs"
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                >
                  <option value="general">Umum (General)</option>
                  <option value="exam">Ujian (Exam)</option>
                  <option value="deadline">Batas Waktu</option>
                  <option value="holiday">Libur</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Warna Label</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none text-xs"
                  value={newEvent.color}
                  onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value })}
                >
                  <option value="purple">Ungu</option>
                  <option value="red">Merah</option>
                  <option value="blue">Biru</option>
                  <option value="green">Hijau</option>
                  <option value="yellow">Kuning</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold"
              >
                Simpan Event
              </button>
              <button
                type="button"
                onClick={() => setShowAddEvent(false)}
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
