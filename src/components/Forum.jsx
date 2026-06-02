import { useState, useEffect } from "react";
import { api } from "../api/client";

export default function Forum({ courseId, role, user }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [activeThread, setActiveThread] = useState(null); // thread details object
  const [showNewThread, setShowNewThread] = useState(false);
  
  // Create Thread state
  const [newThread, setNewThread] = useState({ title: "", content: "", isAnnouncement: false });
  // Reply state
  const [replyContent, setReplyContent] = useState("");

  const loadThreads = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getForumThreads(courseId);
      setThreads(data);
    } catch (err) {
      setError("Gagal memuat forum: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, [courseId]);

  const handleCreateThread = async (e) => {
    e.preventDefault();
    setError("");
    if (!newThread.title.trim() || !newThread.content.trim()) return;

    try {
      await api.createThread({
        course_id: courseId,
        title: newThread.title,
        content: newThread.content,
        is_announcement: newThread.isAnnouncement
      });
      setSuccess("Diskusi baru berhasil ditambahkan!");
      setShowNewThread(false);
      setNewThread({ title: "", content: "", isAnnouncement: false });
      loadThreads();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Gagal membuat thread: " + (err.message || err));
    }
  };

  const handleActiveThread = async (threadId) => {
    setLoading(true);
    setError("");
    try {
      const threadDetails = await api.getThread(threadId);
      setActiveThread(threadDetails);
    } catch (err) {
      setError("Gagal memuat diskusi: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleAddReply = async (e) => {
    e.preventDefault();
    setError("");
    if (!replyContent.trim()) return;

    try {
      const reply = await api.replyThread(activeThread.id, replyContent);
      setSuccess("Balasan berhasil dikirim!");
      setReplyContent("");
      // Refresh active thread details
      handleActiveThread(activeThread.id);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Gagal mengirim balasan: " + (err.message || err));
    }
  };

  const handleDeleteThread = async (threadId) => {
    if (!confirm("Apakah Anda yakin ingin menghapus diskusi ini?")) return;
    setError("");
    try {
      await api.deleteThread(threadId);
      setSuccess("Diskusi berhasil dihapus!");
      setActiveThread(null);
      loadThreads();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Gagal menghapus diskusi: " + (err.message || err));
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!confirm("Apakah Anda yakin ingin menghapus balasan ini?")) return;
    setError("");
    try {
      await api.deleteReply(replyId);
      setSuccess("Balasan berhasil dihapus!");
      handleActiveThread(activeThread.id);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Gagal menghapus balasan: " + (err.message || err));
    }
  };

  const handleVerifyReply = async (replyId) => {
    setError("");
    try {
      await api.verifyReply(replyId);
      setSuccess("Balasan berhasil diverifikasi!");
      handleActiveThread(activeThread.id);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Gagal memverifikasi balasan: " + (err.message || err));
    }
  };

  const isLecturer = role === "lecturer" || role === "admin";
  const currentUser = user || {};

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

      {/* VIEW: THREAD LIST */}
      {!activeThread && !showNewThread && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-lg">💬 FORUM DISKUSI</h3>
            <button
              onClick={() => setShowNewThread(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              ➕ Mulai Diskusi
            </button>
          </div>

          {loading ? (
            <p className="text-center py-6 text-gray-400">Memuat forum...</p>
          ) : threads.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed">
              <p className="text-gray-400">Belum ada diskusi di forum ini.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {threads.map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => handleActiveThread(thread.id)}
                  className={`p-5 bg-white border rounded-2xl shadow-sm hover:border-purple-300 hover:shadow-md transition-all cursor-pointer border-gray-200 ${
                    thread.isAnnouncement ? "border-l-4 border-l-red-500" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          thread.isAnnouncement 
                            ? "bg-red-50 text-red-700 border border-red-100" 
                            : "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}>
                          {thread.isAnnouncement ? "📢 Pengumuman" : "💬 Diskusi"}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(thread.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-800 text-sm truncate">{thread.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{thread.content}</p>
                      <p className="text-[10px] text-gray-400 mt-2 font-medium">Dibuat oleh: {thread.authorName}</p>
                    </div>
                    <div className="text-right flex-shrink-0 text-xs text-gray-400 whitespace-nowrap">
                      {thread.replyCount || 0} 💬
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: CREATE THREAD */}
      {showNewThread && (
        <form onSubmit={handleCreateThread} className="space-y-4 max-w-lg mx-auto">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-lg">➕ Buat Topik Diskusi Baru</h3>
            <button
              type="button"
              onClick={() => setShowNewThread(false)}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold"
            >
              ← Batal
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Judul Topik</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-100"
              value={newThread.title}
              onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Isi Diskusi</label>
            <textarea
              rows={5}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-100"
              value={newThread.content}
              onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
            />
          </div>

          {isLecturer && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isAnn"
                className="rounded text-purple-600 focus:ring-purple-100"
                checked={newThread.isAnnouncement}
                onChange={(e) => setNewThread({ ...newThread, isAnnouncement: e.target.checked })}
              />
              <label htmlFor="isAnn" className="text-xs font-semibold text-gray-750 cursor-pointer">
                Jadikan sebagai Pengumuman Resmi Kelas (Announcement)
              </label>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold"
          >
            Mulai Diskusi
          </button>
        </form>
      )}

      {/* VIEW: THREAD DETAIL & REPLIES */}
      {activeThread && (
        <div className="space-y-5">
          <div className="flex justify-between items-center border-b border-gray-150 pb-3">
            <button
              onClick={() => { setActiveThread(null); loadThreads(); }}
              className="px-3 py-1.5 bg-gray-100 text-gray-650 hover:bg-gray-200 rounded-xl text-xs font-bold transition-colors"
            >
              ← Kembali ke Forum
            </button>

            {(isLecturer || activeThread.authorId === currentUser.id) && (
              <button
                onClick={() => handleDeleteThread(activeThread.id)}
                className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition-colors"
              >
                Hapus Topik 🗑
              </button>
            )}
          </div>

          {/* Main Post */}
          <div className="bg-purple-50/30 p-5 rounded-2xl border border-purple-100/50 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800 text-sm">{activeThread.authorName}</span>
              <span className="text-[10px] text-gray-400">
                {new Date(activeThread.createdAt).toLocaleString("id-ID")}
              </span>
            </div>
            <h4 className="font-extrabold text-gray-900 text-base">{activeThread.title}</h4>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{activeThread.content}</p>
          </div>

          {/* Replies Section */}
          <div className="space-y-3">
            <h5 className="font-bold text-gray-800 text-sm">💬 Balasan ({activeThread.replies?.length || 0})</h5>
            
            {activeThread.replies?.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Belum ada balasan. Jadilah yang pertama menjawab!</p>
            ) : (
              <div className="space-y-2">
                {activeThread.replies.map(reply => (
                  <div key={reply.id} className="p-4 bg-white border border-gray-150 rounded-xl space-y-2 relative">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-700 text-xs">{reply.authorName}</span>
                        {reply.isVerified && (
                          <span className="px-2 py-0.5 bg-green-150 text-green-700 rounded-full text-[9px] font-bold">
                            ✓ Terverifikasi Pengajar
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {isLecturer && !reply.isVerified && (
                          <button
                            onClick={() => handleVerifyReply(reply.id)}
                            className="text-[10px] text-green-600 hover:underline font-bold"
                          >
                            Verifikasi
                          </button>
                        )}
                        {(isLecturer || reply.authorId === currentUser.id) && (
                          <button
                            onClick={() => handleDeleteReply(reply.id)}
                            className="text-[10px] text-red-400 hover:text-red-650"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 text-xs whitespace-pre-wrap">{reply.content}</p>
                    <span className="text-[9px] text-gray-450 block text-right">
                      {new Date(reply.createdAt).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Reply form */}
          <form onSubmit={handleAddReply} className="space-y-2">
            <textarea
              rows={3}
              required
              placeholder="Tulis balasan Anda..."
              className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:outline-none"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl text-xs font-bold"
            >
              Kirim Balasan
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
