import { useState } from "react";
import { api } from "../api/client";

export default function SectionEditor({ courseId, sections, role, onRefresh }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSection, setNewSection] = useState({ title: "", content: "" });
  const [editingSection, setEditingSection] = useState(null);
  const [uploadingSectionId, setUploadingSectionId] = useState(null);
  const [expandedSectionId, setExpandedSectionId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAddSection = async (e) => {
    e.preventDefault();
    setError("");
    if (!newSection.title.trim()) return;

    try {
      await api.addSection(courseId, newSection);
      setNewSection({ title: "", content: "" });
      setShowAddModal(false);
      setSuccess("Materi baru berhasil ditambahkan!");
      onRefresh();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Gagal menambahkan materi: " + (err.message || err));
    }
  };

  const handleEditSection = async (e) => {
    e.preventDefault();
    setError("");
    if (!editingSection.title.trim()) return;

    try {
      await api.updateSection(courseId, editingSection.id, {
        title: editingSection.title,
        content: editingSection.content
      });
      setEditingSection(null);
      setSuccess("Materi berhasil diupdate!");
      onRefresh();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Gagal mengupdate materi: " + (err.message || err));
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!confirm("Apakah Anda yakin ingin menghapus materi ini beserta seluruh filenya?")) return;
    setError("");
    try {
      await api.deleteSection(courseId, sectionId);
      setSuccess("Materi berhasil dihapus!");
      onRefresh();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Gagal menghapus materi: " + (err.message || err));
    }
  };

  const handleFileUpload = async (sectionId, file) => {
    if (!file) return;
    setError("");
    setUploadingSectionId(sectionId);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("section_id", sectionId);

    try {
      await api.uploadFile(formData);
      setSuccess("File berhasil diunggah!");
      onRefresh();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Gagal mengunggah file: " + (err.message || err));
    } finally {
      setUploadingSectionId(null);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!confirm("Apakah Anda yakin ingin menghapus file ini?")) return;
    setError("");
    try {
      await api.deleteFile(fileId);
      setSuccess("File berhasil dihapus!");
      onRefresh();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Gagal menghapus file: " + (err.message || err));
    }
  };

  const handleFileDownload = async (fileId, fileName) => {
    try {
      const blob = await api.downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Gagal mengunduh file: " + (err.message || err));
    }
  };

  const isLecturer = role === "lecturer" || role === "admin";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 text-lg">📖 MATERI KELAS</h3>
        {isLecturer && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all"
          >
            ➕ Tambah Materi
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

      {sections.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed">
          <p className="text-gray-400">Belum ada materi pelajaran yang diunggah.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section) => {
            const isExpanded = expandedSectionId === section.id;
            return (
              <div key={section.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Header */}
                <div
                  onClick={() => setExpandedSectionId(isExpanded ? null : section.id)}
                  className="p-4 flex items-center justify-between cursor-pointer bg-gray-50/50 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📄</span>
                    <span className="font-bold text-gray-700">{section.title}</span>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {isLecturer && (
                      <>
                        <button
                          onClick={() => setEditingSection(section)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors text-xs"
                          title="Edit Materi"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteSection(section.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors text-xs"
                          title="Hapus Materi"
                        >
                          🗑
                        </button>
                      </>
                    )}
                    <span className="text-gray-400 text-xs ml-2">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Content Body */}
                {isExpanded && (
                  <div className="p-5 border-t border-gray-150 space-y-4">
                    {section.content && (
                      <p className="text-gray-600 text-sm whitespace-pre-line bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                        {section.content}
                      </p>
                    )}

                    {/* Files Section */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-400 tracking-wider">ATTACHMENT FILE</h4>
                      {section.files && section.files.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {section.files.map((file) => (
                            <div key={file.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                              <button
                                onClick={() => handleFileDownload(file.id, file.originalName)}
                                className="flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium truncate text-left"
                              >
                                📎 <span className="truncate">{file.originalName}</span>
                              </button>
                              {isLecturer && (
                                <button
                                  onClick={() => handleDeleteFile(file.id)}
                                  className="text-xs text-red-400 hover:text-red-600 p-1"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Tidak ada file lampiran.</p>
                      )}

                      {/* File Upload Trigger */}
                      {isLecturer && (
                        <div className="mt-3">
                          <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors">
                            📁 Unggah File
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => handleFileUpload(section.id, e.target.files[0])}
                              disabled={uploadingSectionId === section.id}
                            />
                          </label>
                          {uploadingSectionId === section.id && (
                            <span className="text-xs text-gray-500 ml-2 animate-pulse">Sedang mengunggah...</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <form
            onSubmit={handleAddSection}
            className="modal-content max-w-md space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800">➕ Tambah Materi Baru</h3>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Judul Materi</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-100"
                value={newSection.title}
                onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Konten / Ringkasan</label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-100"
                value={newSection.content}
                onChange={(e) => setNewSection({ ...newSection, content: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-150 text-gray-700 rounded-xl"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {editingSection && (
        <div className="modal-overlay" onClick={() => setEditingSection(null)}>
          <form
            onSubmit={handleEditSection}
            className="modal-content max-w-md space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800">✏️ Edit Materi</h3>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Judul Materi</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-100"
                value={editingSection.title}
                onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">Konten / Ringkasan</label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-100"
                value={editingSection.content}
                onChange={(e) => setEditingSection({ ...editingSection, content: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold"
              >
                Update
              </button>
              <button
                type="button"
                onClick={() => setEditingSection(null)}
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
