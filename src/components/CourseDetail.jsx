import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import SectionEditor from "./SectionEditor";
import AssignmentList from "./AssignmentList";
import QuizTab from "./QuizTab";
import Forum from "./Forum";
import CalendarWidget from "./CalendarWidget";
import Gradebook from "./Gradebook";
import QRAttendance from "./QRAttendance";

export default function CourseDetail({ role, user }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeTab, setActiveTab] = useState("materi");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCourseData = async () => {
    setLoading(true);
    setError("");
    try {
      const courseData = await api.getCourse(courseId);
      setCourse(courseData);
      
      const sectionsData = await api.getCourseSections(courseId);
      setSections(sectionsData);
    } catch (err) {
      console.error("Error loading course details:", err);
      setError("Gagal memuat detail kelas: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex flex-col justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Memuat kelas...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] p-6">
        <div className="max-w-md mx-auto bg-white rounded-2xl p-6 shadow-md text-center space-y-4">
          <span className="text-4xl">⚠️</span>
          <h3 className="font-bold text-gray-800 text-lg">Error</h3>
          <p className="text-gray-500 text-sm">{error || "Kelas tidak ditemukan."}</p>
          <button
            onClick={() => navigate("/")}
            className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "materi", label: "📖 Materi", component: <SectionEditor courseId={courseId} sections={sections} role={role} onRefresh={loadCourseData} /> },
    { id: "tugas", label: "📝 Tugas", component: <AssignmentList courseId={courseId} role={role} /> },
    { id: "quiz", label: "✏️ Kuis", component: <QuizTab courseId={courseId} role={role} /> },
    { id: "forum", label: "💬 Forum", component: <Forum courseId={courseId} role={role} user={user} /> },
    { id: "kalender", label: "📅 Kalender", component: <CalendarWidget courseId={courseId} role={role} /> },
    { id: "gradebook", label: "📊 Nilai", component: <Gradebook courseId={courseId} role={role} /> },
    { id: "absensi", label: "⏱ Absensi", component: <QRAttendance courseCode={course.courseCode} role={role} /> }
  ];

  return (
    <div className="min-h-screen bg-[#f0f4f8] page-enter pb-10">
      {/* Premium Header Card */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 text-white py-10 px-4 sm:px-6 relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <button
              onClick={() => navigate("/")}
              className="mb-4 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all"
            >
              ← Kembali ke Daftar Kelas
            </button>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-white/20 rounded-lg text-xs font-bold tracking-widest font-mono">
                {course.courseCode}
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight">{course.courseName}</h2>
            </div>
            <p className="text-white/80 mt-2 text-sm max-w-2xl">{course.description || "Tidak ada deskripsi kelas."}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation Menu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6">
        <div className="bg-white rounded-2xl shadow-md p-2 flex flex-wrap gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Rendering */}
        <div className="mt-6 bg-white rounded-3xl shadow-sm p-6 sm:p-8 min-h-[400px] border border-gray-100">
          {tabs.find((tab) => tab.id === activeTab)?.component}
        </div>
      </div>
    </div>
  );
}
