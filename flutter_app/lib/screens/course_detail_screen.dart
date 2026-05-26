import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../services/course_service.dart';
import 'quiz_screen.dart';
import 'forum_screen.dart';
import 'gradebook_screen.dart';
import 'attendance_screen.dart';

class CourseDetailScreen extends StatefulWidget {
  final int courseId;
  const CourseDetailScreen({super.key, required this.courseId});

  @override
  State<CourseDetailScreen> createState() => _CourseDetailScreenState();
}

class _CourseDetailScreenState extends State<CourseDetailScreen>
    with SingleTickerProviderStateMixin {
  Map<String, dynamic>? _detail;
  bool _loading = true;
  String? _error;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await CourseService.getCourseDetail(widget.courseId);
      setState(() {
        _detail = data;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_detail?['course']?['course_name'] ?? 'Detail Kursus'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white60,
          tabs: const [
            Tab(text: 'Informasi'),
            Tab(text: 'Materi'),
            Tab(text: 'Quiz'),
            Tab(text: 'Forum'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.grade),
            tooltip: 'Nilai',
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) =>
                    GradebookScreen(courseId: widget.courseId),
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            tooltip: 'Presensi',
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) =>
                    AttendanceScreen(courseId: widget.courseId),
              ),
            ),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_error!),
                      const SizedBox(height: 8),
                      ElevatedButton(
                          onPressed: _loadDetail,
                          child: const Text('Coba Lagi')),
                    ],
                  ),
                )
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildInfoTab(),
                    _buildMaterialTab(),
                    _buildQuizTab(),
                    _buildForumTab(),
                  ],
                ),
    );
  }

  Widget _buildInfoTab() {
    final course = _detail?['course'];
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _infoRow('Kode Kursus', course?['course_code'] ?? '-'),
                  _infoRow('Fakultas', course?['faculty'] ?? '-'),
                  _infoRow('Deskripsi', course?['description'] ?? '-'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMaterialTab() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.construction, size: 48, color: Colors.grey),
          SizedBox(height: 16),
          Text('Materi akan segera tersedia',
              style: TextStyle(color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildQuizTab() {
    return QuizListWidget(courseId: widget.courseId);
  }

  Widget _buildForumTab() {
    return ForumListWidget(courseId: widget.courseId);
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: const TextStyle(
                  fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(color: Colors.grey[700])),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
}

class QuizListWidget extends StatefulWidget {
  final int courseId;
  const QuizListWidget({super.key, required this.courseId});

  @override
  State<QuizListWidget> createState() => _QuizListWidgetState();
}

class _QuizListWidgetState extends State<QuizListWidget> {
  List<dynamic> _quizzes = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ApiClient.get(
          '/courses/${widget.courseId}/quiz');
      setState(() {
        _quizzes = data['quizzes'] ?? [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_quizzes.isEmpty) {
      return const Center(
        child: Text('Belum ada quiz', style: TextStyle(color: Colors.grey)),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _quizzes.length,
      itemBuilder: (context, index) {
        final quiz = _quizzes[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: const Icon(Icons.quiz, color: Colors.orange),
            title: Text(quiz['title'] ?? 'Quiz'),
            subtitle: quiz['description'] != null
                ? Text(quiz['description'])
                : null,
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) =>
                    QuizScreen(quizId: quiz['id'], quizData: quiz),
              ),
            ),
          ),
        );
      },
    );
  }
}

class ForumListWidget extends StatefulWidget {
  final int courseId;
  const ForumListWidget({super.key, required this.courseId});

  @override
  State<ForumListWidget> createState() => _ForumListWidgetState();
}

class _ForumListWidgetState extends State<ForumListWidget> {
  List<dynamic> _threads = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await ApiClient.get(
          '/courses/${widget.courseId}/forum');
      setState(() {
        _threads = data['threads'] ?? [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_threads.isEmpty) {
      return const Center(
        child: Text('Belum ada diskusi',
            style: TextStyle(color: Colors.grey)),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _threads.length,
      itemBuilder: (context, index) {
        final thread = _threads[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: const Icon(Icons.forum, color: Colors.blue),
            title: Text(thread['title'] ?? 'Thread'),
            subtitle: Text(
              thread['author_name'] ?? 'Anonim',
              style: TextStyle(color: Colors.grey[600], fontSize: 12),
            ),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => ForumScreen(
                    threadId: thread['id'], threadData: thread),
              ),
            ),
          ),
        );
      },
    );
  }
}


