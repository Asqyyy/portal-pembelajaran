-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'lecturer', 'admin')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  course_code VARCHAR(20) UNIQUE NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'learning',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  category VARCHAR(20) DEFAULT 'learning' CHECK (category IN ('learning', 'teaching')),
  enrolled_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Course Sections (content/materi)
CREATE TABLE IF NOT EXISTS course_sections (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Section Files (uploaded files attached to sections)
CREATE TABLE IF NOT EXISTS section_files (
  id SERIAL PRIMARY KEY,
  section_id INTEGER REFERENCES course_sections(id) ON DELETE CASCADE,
  original_name VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  size_bytes INTEGER,
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP,
  max_score INTEGER DEFAULT 100,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Assignment Submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  file_id INTEGER REFERENCES section_files(id),
  text_content TEXT,
  score INTEGER,
  feedback TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  graded_at TIMESTAMP,
  UNIQUE(assignment_id, student_id)
);

-- Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) DEFAULT 'mixed',
  time_limit INTEGER, -- minutes
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quiz Questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('mc', 'tf', 'essay')),
  options JSONB, -- for MC: ["A", "B", "C", "D"]
  correct_answer TEXT, -- for MC/TF
  points INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0
);

-- Quiz Results
CREATE TABLE IF NOT EXISTS quiz_results (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL, -- { questionId: answer }
  score NUMERIC(5,2),
  max_score INTEGER,
  submitted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(quiz_id, student_id)
);

-- Forum Threads
CREATE TABLE IF NOT EXISTS forum_threads (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  author_id INTEGER REFERENCES users(id),
  author_name VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_announcement BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Forum Replies
CREATE TABLE IF NOT EXISTS forum_replies (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER REFERENCES forum_threads(id) ON DELETE CASCADE,
  author_id INTEGER REFERENCES users(id),
  author_name VARCHAR(100),
  content TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Grade Components
CREATE TABLE IF NOT EXISTS grade_components (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  weight NUMERIC(5,2) DEFAULT 0,
  max_score INTEGER DEFAULT 100
);

-- Grades
CREATE TABLE IF NOT EXISTS grades (
  id SERIAL PRIMARY KEY,
  component_id INTEGER REFERENCES grade_components(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  score NUMERIC(5,2),
  UNIQUE(component_id, student_id)
);

-- Attendance Sessions
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,
  token VARCHAR(100) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Attendance Records
CREATE TABLE IF NOT EXISTS attendance_records (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  student_name VARCHAR(100),
  recorded_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- Calendar Events
CREATE TABLE IF NOT EXISTS calendar_events (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_type VARCHAR(50) DEFAULT 'general',
  color VARCHAR(20) DEFAULT '#667eea',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed 21 courses for MA/SMA
INSERT INTO courses (course_code, course_name, description, category) VALUES
  ('MTK-001', 'Matematika', 'Pelajaran matematika dasar dan lanjutan', 'learning'),
  ('FIS-002', 'Fisika', 'Ilmu fisika dan penerapannya', 'learning'),
  ('KIM-003', 'Kimia', 'Ilmu kimia dasar dan reaksi', 'learning'),
  ('BIO-004', 'Biologi', 'Ilmu biologi dan kehidupan', 'learning'),
  ('BIN-005', 'Bahasa Indonesia', 'Tata bahasa dan sastra Indonesia', 'learning'),
  ('BIG-006', 'Bahasa Inggris', 'English language studies', 'learning'),
  ('SEJ-007', 'Sejarah', 'Sejarah Indonesia dan dunia', 'learning'),
  ('GEO-008', 'Geografi', 'Ilmu geografi dan lingkungan', 'learning'),
  ('EKO-009', 'Ekonomi', 'Ilmu ekonomi dasar', 'learning'),
  ('SOS-010', 'Sosiologi', 'Ilmu sosiologi dan masyarakat', 'learning'),
  ('PKN-011', 'PKN', 'Pendidikan Kewarganegaraan', 'learning'),
  ('PAI-012', 'Pendidikan Agama Islam', 'Studi agama Islam', 'learning'),
  ('SBD-013', 'Seni Budaya', 'Seni rupa, musik, dan budaya', 'learning'),
  ('PJK-014', 'PJOK', 'Pendidikan Jasmani dan Olahraga', 'learning'),
  ('TIK-015', 'Informatika', 'Teknologi informasi dan komunikasi', 'learning'),
  ('BAR-016', 'Bahasa Arab', 'Studi bahasa Arab', 'learning'),
  ('FIQ-017', 'Fiqih', 'Ilmu fiqih Islam', 'learning'),
  ('AQD-018', 'Aqidah Akhlak', 'Studi aqidah dan akhlak', 'learning'),
  ('QHD-019', 'Quran Hadist', 'Studi Al-Quran dan Hadist', 'learning'),
  ('SKI-020', 'SKI', 'Sejarah Kebudayaan Islam', 'learning'),
  ('PRK-021', 'Prakarya', 'Keterampilan dan prakarya', 'learning')
ON CONFLICT (course_code) DO NOTHING;
