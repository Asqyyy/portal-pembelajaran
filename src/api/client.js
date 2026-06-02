const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Helper: get token from localStorage
const token = () => localStorage.getItem('ppToken');

function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function convertKeys(obj, converter) {
  if (Array.isArray(obj)) return obj.map(item => convertKeys(item, converter));
  if (obj !== null && typeof obj === 'object' && !(obj instanceof File) && !(obj instanceof Blob) && !(obj instanceof FormData)) {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      acc[converter(key)] = convertKeys(value, converter);
      return acc;
    }, {});
  }
  return obj;
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  const headers = { ...options.headers };
  
  if (token()) {
    headers['Authorization'] = 'Bearer ' + token();
  }

  let body = options.body;
  
  // Auto-convert request body keys to snake_case unless it is FormData
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    const parsed = typeof body === 'string' ? JSON.parse(body) : body;
    body = JSON.stringify(convertKeys(parsed, toSnakeCase));
  }

  try {
    const res = await fetch(API_BASE + path, {
      ...options,
      headers,
      body,
      signal: controller.signal
    });

    clearTimeout(id);

    // For file downloads, return blob directly
    const contentType = res.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      if (!res.ok) {
        throw new Error('Gagal mengunduh file, status: ' + res.status);
      }
      return await res.blob();
    }

    const data = await res.json();
    if (!res.ok) {
      const errMsg = data.error || data.message || 'Terjadi kesalahan';
      const error = new Error(errMsg);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    // Auto-convert response keys to camelCase
    return convertKeys(data, toCamelCase);
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      const timeoutError = new Error('Permintaan ke server melebihi batas waktu (timeout)');
      timeoutError.status = 408;
      throw timeoutError;
    }
    throw err;
  }
}

export const api = {
  // Auth
  login: (username, password) => request('/auth/login', { method: 'POST', body: { username, password } }),
  register: (username, password, email) => request('/auth/register', { method: 'POST', body: { username, password, email } }),
  getMe: () => request('/auth/me'),

  // Courses
  getCourses: () => request('/courses'),
  getCourse: (id) => request('/courses/' + id),
  enrollCourse: (id, category) => request('/courses/' + id + '/enroll', { method: 'POST', body: { category } }),
  createCourse: (data) => request('/courses', { method: 'POST', body: data }),
  updateCourse: (id, data) => request('/courses/' + id, { method: 'PUT', body: data }),
  deleteCourse: (id) => request('/courses/' + id, { method: 'DELETE' }),

  // Course Sections
  getCourseSections: (courseId) => request('/courses/' + courseId + '/sections'),
  addSection: (courseId, data) => request('/courses/' + courseId + '/sections', { method: 'POST', body: data }),
  updateSection: (courseId, sectionId, data) => request('/courses/' + courseId + '/sections/' + sectionId, { method: 'PUT', body: data }),
  deleteSection: (courseId, sectionId) => request('/courses/' + courseId + '/sections/' + sectionId, { method: 'DELETE' }),

  // Users
  getUser: (id) => request('/users/' + id),
  updateUser: (id, data) => request('/users/' + id, { method: 'PUT', body: data }),

  // Files
  uploadFile: (formData) => request('/files/upload', { method: 'POST', body: formData }), // skip content-type json/snake_case conversion
  downloadFile: (id) => request('/files/' + id),
  deleteFile: (id) => request('/files/' + id, { method: 'DELETE' }),

  // Assignments
  getAssignments: (courseId) => request('/assignments/' + courseId),
  createAssignment: (data) => request('/assignments', { method: 'POST', body: data }),
  submitAssignment: (id, data) => request('/assignments/' + id + '/submit', { method: 'POST', body: data }),
  getSubmissions: (assignmentId) => request('/assignments/' + assignmentId + '/submissions'),
  gradeSubmission: (submissionId, data) => request('/assignments/submissions/' + submissionId + '/grade', { method: 'PUT', body: data }),

  // Quiz
  createQuiz: (data) => request('/quiz', { method: 'POST', body: data }),
  getQuizByCourse: (courseId) => request('/quiz/course/' + courseId),
  getQuiz: (id) => request('/quiz/' + id),
  submitQuiz: (id, answers) => request('/quiz/' + id + '/submit', { method: 'POST', body: { answers } }),
  getQuizResults: (id) => request('/quiz/' + id + '/results'),
  gradeQuizEssay: (resultId, data) => request('/quiz/results/' + resultId + '/grade', { method: 'PUT', body: data }),

  // Forum
  getForumThreads: (courseId) => request('/forum/course/' + courseId),
  createThread: (data) => request('/forum/thread', { method: 'POST', body: data }),
  getThread: (id) => request('/forum/thread/' + id),
  replyThread: (id, content) => request('/forum/thread/' + id + '/reply', { method: 'POST', body: { content } }),
  deleteThread: (id) => request('/forum/threads/' + id, { method: 'DELETE' }),
  deleteReply: (id) => request('/forum/replies/' + id, { method: 'DELETE' }),
  verifyThread: (id) => request('/forum/thread/' + id + '/verify', { method: 'PUT' }),
  verifyReply: (id) => request('/forum/reply/' + id + '/verify', { method: 'PUT' }),

  // Gradebook
  getGradebook: (courseId) => request('/gradebook/course/' + courseId),
  getEnrolledStudents: (courseId) => request('/gradebook/' + courseId + '/students'),
  addGradeComponent: (data) => request('/gradebook/component', { method: 'POST', body: data }),
  removeGradeComponent: (id) => request('/gradebook/component/' + id, { method: 'DELETE' }),
  updateGrade: (data) => request('/gradebook/grade', { method: 'PUT', body: data }),
  getGradeSummary: (courseId) => request('/gradebook/course/' + courseId + '/summary'),

  // Attendance
  createAttendanceSession: (courseCode, duration) => request('/attendance/generate', { method: 'POST', body: { course_code: courseCode, duration } }),
  recordAttendance: (token) => request('/attendance/record', { method: 'POST', body: { token } }),
  getAttendance: (courseCode) => request('/attendance/course/' + courseCode),

  // Calendar
  getCalendarEvents: (courseId) => request('/calendar/' + courseId),
  createCalendarEvent: (data) => request('/calendar', { method: 'POST', body: data }),
  deleteCalendarEvent: (id) => request('/calendar/' + id, { method: 'DELETE' })
};
