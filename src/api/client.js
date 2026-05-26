const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Helper: get token from localStorage (satu2nya yg tersisa)
const token = () => localStorage.getItem('ppToken');

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token()) headers['Authorization'] = 'Bearer ' + token();
  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

export const api = {
  // Auth
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (username, password, email) => request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, email }) }),
  getMe: () => request('/auth/me'),

  // Courses
  getCourses: () => request('/courses'),
  getCourse: (id) => request('/courses/' + id),
  enrollCourse: (id, category) => request('/courses/' + id + '/enroll', { method: 'POST', body: JSON.stringify({ category }) }),

  // Users
  getUser: (id) => request('/users/' + id),
  updateUser: (id, data) => request('/users/' + id, { method: 'PUT', body: JSON.stringify(data) }),

  // Quiz
  createQuiz: (data) => request('/quiz', { method: 'POST', body: JSON.stringify(data) }),
  getQuizByCourse: (courseId) => request('/quiz/course/' + courseId),
  getQuiz: (id) => request('/quiz/' + id),
  submitQuiz: (id, answers) => request('/quiz/' + id + '/submit', { method: 'POST', body: JSON.stringify({ answers }) }),
  getQuizResults: (id) => request('/quiz/' + id + '/results'),

  // Forum
  getForumThreads: (courseId) => request('/forum/course/' + courseId),
  createThread: (data) => request('/forum/thread', { method: 'POST', body: JSON.stringify(data) }),
  getThread: (id) => request('/forum/thread/' + id),
  replyThread: (id, content) => request('/forum/thread/' + id + '/reply', { method: 'POST', body: JSON.stringify({ content }) }),
  verifyThread: (id) => request('/forum/thread/' + id + '/verify', { method: 'PUT' }),
  verifyReply: (id) => request('/forum/reply/' + id + '/verify', { method: 'PUT' }),

  // Gradebook
  getGradebook: (courseId) => request('/gradebook/course/' + courseId),
  addGradeComponent: (data) => request('/gradebook/component', { method: 'POST', body: JSON.stringify(data) }),
  removeGradeComponent: (id) => request('/gradebook/component/' + id, { method: 'DELETE' }),
  updateGrade: (data) => request('/gradebook/grade', { method: 'PUT', body: JSON.stringify(data) }),
  getGradeSummary: (courseId) => request('/gradebook/course/' + courseId + '/summary'),

  // Attendance
  recordAttendance: (courseCode, token) => request('/attendance/record', { method: 'POST', body: JSON.stringify({ courseCode, token }) }),
  getAttendance: (courseCode) => request('/attendance/course/' + courseCode),
};
