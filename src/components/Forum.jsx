import { useState, useEffect } from "react";
import { api } from "../api/client";

export default function Forum({ courseId, role }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNewThread, setShowNewThread] = useState(false);
  const [activeThread, setActiveThread] = useState(null);
  const [newThread, setNewThread] = useState({ title: "", content: "", isAnnouncement: false });
  const [replyContent, setReplyContent] = useState("");

  // Load threads from API
  useEffect(() => {
    setLoading(true);
    setError("");
    api.getForumThreads(courseId)
      .then((data) => {
        setThreads(Array.isArray(data) ? data : (data.threads || []));
      })
      .catch(() => {
        setError("Gagal memuat forum.");
        // Fallback to localStorage
        try {
          const cached = JSON.parse(localStorage.getItem('forum_' + courseId) || "[]");
          if (cached.length > 0) setThreads(cached);
        } catch {}
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  // Cache in localStorage
  useEffect(() => {
    if (threads.length > 0) {
      localStorage.setItem('forum_' + courseId, JSON.stringify(threads));
    }
  }, [threads, courseId]);

  const createThread = async () => {
    if (!newThread.title.trim() || !newThread.content.trim()) return;
    const threadData = {
      courseId,
      title: newThread.title,
      content: newThread.content,
      isAnnouncement: newThread.isAnnouncement,
      author: role === "lecturer" ? "Pengajar" : "Siswa",
      role: role,
    };

    try {
      const saved = await api.createThread(threadData);
      setThreads(prev => [{ ...saved, id: saved.id || Date.now(), createdAt: new Date().toLocaleString("id-ID"), replies: saved.replies || [] }, ...prev]);
    } catch {
      // Fallback
      const thread = {
        id: Date.now(),
        ...threadData,
        createdAt: new Date().toLocaleString("id-ID"),
        replies: [],
        pinned: newThread.isAnnouncement,
      };
      setThreads(prev => [thread, ...prev]);
    }
    setNewThread({ title: "", content: "", isAnnouncement: false });
    setShowNewThread(false);
  };

  const addReply = async (threadId) => {
    if (!replyContent.trim()) return;
    const replyData = {
      id: Date.now(),
      content: replyContent,
      author: role === "lecturer" ? "Pengajar" : "Siswa",
      role: role,
      createdAt: new Date().toLocaleString("id-ID"),
      isVerified: false,
    };

    setThreads(prev => prev.map(t => {
      if (t.id !== threadId) return t;
      return { ...t, replies: [...t.replies, replyData] };
    }));
    setReplyContent("");

    // Try API
    try {
      await api.replyThread(threadId, replyContent);
    } catch {}
  };

  const markVerified = async (threadId, replyId) => {
    setThreads(prev => prev.map(t => {
      if (t.id !== threadId) return t;
      return {
        ...t,
        replies: t.replies.map(r => r.id === replyId ? { ...r, isVerified: true } : r)
      };
    }));
    try { await api.verifyReply(replyId); } catch {}
  };

  const deleteThread = (threadId) => {
    setThreads(prev => prev.filter(t => t.id !== threadId));
  };

  const deleteReply = (threadId, replyId) => {
    setThreads(prev => prev.map(t => {
      if (t.id !== threadId) return t;
      return { ...t, replies: t.replies.filter(r => r.id !== replyId) };
    }));
  };

  if (loading) {
    return <div className="text-center py-12"><span className="text-gray-400">Loading forum...</span></div>;
  }

  if (error) {
    return <div className="text-center py-12"><span className="text-red-400">Error: {error}</span></div>;
  }

  // Thread Detail View
  if (activeThread) {
    const thread = threads.find(t => t.id === activeThread);
    if (!thread) return null;

    const sortedReplies = [...(thread.replies || [])].sort((a, b) => {
      if (a.isVerified && !b.isVerified) return -1;
      if (!a.isVerified && b.isVerified) return 1;
      return 0;
    });

    return (
      <div>
        <button onClick={() => setActiveThread(null)} className="text-purple-600 hover:text-purple-800 text-sm mb-4 flex items-center gap-1">
          ← Kembali ke Forum
        </button>

        <div className={'rounded-2xl p-6 mb-6 ' + (thread.isAnnouncement ? "bg-amber-50 border border-amber-200" : "bg-white border border-gray-200")}>
          <div className="flex items-center gap-2 mb-2">
            {thread.isAnnouncement && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">📌 Pengumuman</span>}
            <span className={'text-xs px-2 py-0.5 rounded-full ' + (thread.role === "lecturer" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700")}>
              {thread.role === "lecturer" ? "👨🏫" : "👨🎓"} {thread.author}
            </span>
            <span className="text-xs text-gray-400">{thread.createdAt}</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{thread.title}</h3>
          <p className="text-gray-600 whitespace-pre-line">{thread.content}</p>
          {(role === "lecturer" || thread.role === "lecturer") && (
            <button onClick={() => deleteThread(thread.id)} className="text-xs text-red-400 hover:text-red-600 mt-3">
              🗑 Hapus Thread
            </button>
          )}
        </div>

        <h4 className="font-semibold text-gray-700 mb-4">{thread.replies?.length || 0} Balasan</h4>

        {sortedReplies.map(reply => (
          <div key={reply.id} className={'rounded-xl p-4 mb-3 ml-0 md:ml-6 border ' + (
            reply.isVerified ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <span className={'text-xs px-2 py-0.5 rounded-full ' + (reply.role === "lecturer" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700")}>
                {reply.role === "lecturer" ? "👨🏫" : "👨🎓"} {reply.author}
              </span>
              <span className="text-xs text-gray-400">{reply.createdAt}</span>
              {reply.isVerified && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ Jawaban Resmi</span>
              )}
            </div>
            <p className="text-gray-600 text-sm whitespace-pre-line">{reply.content}</p>
            <div className="flex items-center gap-3 mt-2">
              {role === "lecturer" && !reply.isVerified && (
                <button onClick={() => markVerified(thread.id, reply.id)}
                  className="text-xs text-green-600 hover:text-green-800 font-medium">
                  ✅ Tandai Jawaban Resmi
                </button>
              )}
              {role === "lecturer" && (
                <button onClick={() => deleteReply(thread.id, reply.id)}
                  className="text-xs text-red-400 hover:text-red-600">
                  🗑 Hapus
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="bg-white border border-gray-200 rounded-xl p-4 mt-4">
          <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)}
            placeholder="Tulis balasanmu..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm h-24 focus:outline-none focus:border-purple-400 resize-none" />
          <div className="flex justify-end mt-3">
            <button onClick={() => addReply(thread.id)}
              className="px-5 py-2.5 bg-purple-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-600 transition-colors">
              💬 Kirim Balasan
            </button>
          </div>
        </div>
      </div>
    );
  }

  // New Thread Form
  if (showNewThread) {
    return (
      <div>
        <button onClick={() => setShowNewThread(false)} className="text-purple-600 hover:text-purple-800 text-sm mb-4 flex items-center gap-1">
          ← Kembali
        </button>
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">➕ Buat Thread Baru</h3>
          <input type="text" value={newThread.title} onChange={e => setNewThread(p => ({ ...p, title: e.target.value }))}
            placeholder="Judul thread..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm mb-4 focus:outline-none focus:border-purple-500" />
          <textarea value={newThread.content} onChange={e => setNewThread(p => ({ ...p, content: e.target.value }))}
            placeholder="Isi thread..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm h-32 mb-4 resize-none focus:outline-none focus:border-purple-500" />
          {role === "lecturer" && (
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input type="checkbox" checked={newThread.isAnnouncement}
                onChange={e => setNewThread(p => ({ ...p, isAnnouncement: e.target.checked }))}
                className="w-4 h-4 text-purple-600 rounded" />
              <span className="text-sm text-gray-600">📌 Jadikan pengumuman (pinned, tidak bisa dibalas)</span>
            </label>
          )}
          <div className="flex gap-3">
            <button onClick={createThread}
              className="px-6 py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-colors">
              Posting Thread
            </button>
            <button onClick={() => setShowNewThread(false)}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors">
              Batal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Forum List
  const announcements = threads.filter(t => t.isAnnouncement);
  const normalThreads = threads.filter(t => !t.isAnnouncement);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800">💬 Forum Diskusi</h3>
          <p className="text-sm text-gray-500">{threads.length} thread</p>
        </div>
        <button onClick={() => { setNewThread({ title: "", content: "", isAnnouncement: false }); setShowNewThread(true); }}
          className="px-5 py-2.5 bg-purple-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-600 transition-colors">
          ➕ Thread Baru
        </button>
      </div>

      {threads.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <span className="text-5xl">💬</span>
          <p className="text-gray-500 mt-3">Belum ada diskusi. Mulai thread pertama!</p>
        </div>
      ) : (
        <>
          {announcements.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-amber-600 mb-3">📌 Pengumuman</h4>
              {announcements.map(thread => (
                <div key={thread.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">📌 Pengumuman</span>
                    <span className="text-xs text-gray-400">{thread.createdAt}</span>
                  </div>
                  <h4 className="font-semibold text-gray-800">{thread.title}</h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{thread.content}</p>
                  <button onClick={() => setActiveThread(thread.id)}
                    className="text-xs text-purple-600 hover:underline mt-2">Lihat selengkapnya →</button>
                </div>
              ))}
            </div>
          )}

          {normalThreads.length > 0 && (
            <div>
              {announcements.length > 0 && <h4 className="text-sm font-semibold text-gray-500 mb-3">🧵 Diskusi</h4>}
              {normalThreads.map(thread => (
                <div key={thread.id} onClick={() => setActiveThread(thread.id)}
                  className="bg-white border border-gray-200 rounded-xl p-5 mb-3 hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={'text-xs px-2 py-0.5 rounded-full ' + (thread.role === "lecturer" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700")}>
                          {thread.role === "lecturer" ? "👨🏫 Pengajar" : "👨🎓 Siswa"}
                        </span>
                        <span className="text-xs text-gray-400">{thread.createdAt}</span>
                      </div>
                      <h4 className="font-semibold text-gray-800 truncate">{thread.title}</h4>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{thread.content}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs text-gray-400">{thread.replies?.length || 0} 💬</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
