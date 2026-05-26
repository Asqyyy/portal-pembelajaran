import { useState, useEffect } from "react";
import { api } from "../api/client";

// localStorage keys (hanya dua ini yg tersisa dari localStorage era)
const TOKEN_KEY = "ppToken";
const USER_KEY = "ppUser";

export function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(!user);

  // Validate token on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    api.getMe()
      .then((data) => {
        setUser(data.user || data);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user || data));
      })
      .catch((err) => {
        if (err.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setUser(null);
        }
        console.warn('Auth check failed (API mungkin belum jalan):', err);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  const login = async (username, password) => {
    try {
      const data = await api.login(username, password);
      localStorage.setItem(TOKEN_KEY, data.token);
      const userData = data.user || { username, role: data.role || 'student' };
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      return { success: false, error: err.error || err.message || 'Login gagal' };
    }
  };

  const register = async (username, password, email) => {
    try {
      await api.register(username, password, email);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.error || err.message || 'Registrasi gagal' };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const updateUser = async (updates) => {
    setUser((prev) => prev ? { ...prev, ...updates } : null);
    if (user?.id) {
      try { await api.updateUser(user.id, updates); } catch {}
    }
  };

  return { user, loading, login, register, logout, updateUser };
}

// QR Attendance utilities — kept for backward compatibility
export function generateQRData(courseCode) {
  const token = Math.random().toString(36).substring(2, 10);
  const now = Date.now();
  const expiresIn = 60;
  return {
    courseCode,
    token,
    generatedAt: now,
    expiresAt: now + expiresIn * 1000,
  };
}

export function recordAttendance(courseCode, qrToken, studentName) {
  const key = 'attendance_' + courseCode;
  const records = JSON.parse(localStorage.getItem(key) || '[]');
  if (records.find((r) => r.token === qrToken && r.student === studentName)) {
    return { success: false, error: 'Kamu sudah absen untuk sesi ini.' };
  }
  records.push({
    student: studentName,
    token: qrToken,
    time: new Date().toLocaleString('id-ID'),
    timestamp: Date.now(),
  });
  localStorage.setItem(key, JSON.stringify(records));
  return { success: true };
}
