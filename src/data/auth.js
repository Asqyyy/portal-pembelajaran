import { useState, useEffect } from "react";

// Simple localStorage-based auth
export function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("ppUser");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("ppUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("ppUser");
    }
  }, [user]);

  const login = (username, password) => {
    // Check against registered users
    const users = JSON.parse(localStorage.getItem("ppUsers") || "[]");
    const found = users.find((u) => u.username === username && u.password === password);
    if (found) {
      const sessionUser = {
        username: found.username,
        role: found.role || "student",
        email: found.email,
        enrolledCourses: found.enrolledCourses || [],
        teachingCourses: found.teachingCourses || [],
      };
      setUser(sessionUser);
      return { success: true, user: sessionUser };
    }
    return { success: false, error: "Username atau password salah." };
  };

  const register = (username, password, email) => {
    const users = JSON.parse(localStorage.getItem("ppUsers") || "[]");
    if (users.find((u) => u.username === username)) {
      return { success: false, error: "Username sudah digunakan." };
    }
    if (users.find((u) => u.email === email)) {
      return { success: false, error: "Email sudah terdaftar." };
    }
    const newUser = {
      username,
      password,
      email,
      role: "student",
      enrolledCourses: [],
      teachingCourses: [],
      registeredAt: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem("ppUsers", JSON.stringify(users));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser((prev) => prev ? { ...prev, ...updates } : null);
    // Also update in users array
    const users = JSON.parse(localStorage.getItem("ppUsers") || "[]");
    const idx = users.findIndex((u) => u.username === user?.username);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...updates };
      localStorage.setItem("ppUsers", JSON.stringify(users));
    }
  };

  return { user, login, register, logout, updateUser };
}

// QR Attendance utilities
export function generateQRData(courseCode) {
  const token = Math.random().toString(36).substring(2, 10);
  const now = Date.now();
  const expiresIn = 60; // 60 seconds default
  return {
    courseCode,
    token,
    generatedAt: now,
    expiresAt: now + expiresIn * 1000,
  };
}

export function recordAttendance(courseCode, qrToken, studentName) {
  const key = `attendance_${courseCode}`;
  const records = JSON.parse(localStorage.getItem(key) || "[]");
  // Check if token already used
  if (records.find((r) => r.token === qrToken && r.student === studentName)) {
    return { success: false, error: "Kamu sudah absen untuk sesi ini." };
  }
  records.push({
    student: studentName,
    token: qrToken,
    time: new Date().toLocaleString("id-ID"),
    timestamp: Date.now(),
  });
  localStorage.setItem(key, JSON.stringify(records));
  return { success: true };
}
