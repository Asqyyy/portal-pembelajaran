import 'package:flutter/material.dart';
import '../models/course.dart';
import '../services/course_service.dart';
import 'course_detail_screen.dart';

class CourseListScreen extends StatefulWidget {
  const CourseListScreen({super.key});

  @override
  State<CourseListScreen> createState() => _CourseListScreenState();
}

class _CourseListScreenState extends State<CourseListScreen> {
  List<Course> _courses = [];
  bool _loading = true;
  String? _error;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadCourses();
  }

  Future<void> _loadCourses({String? search}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final courses = await CourseService.getCourses(search: search);
      setState(() {
        _courses = courses;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  void _enroll(int courseId, String courseName) async {
    try {
      await CourseService.enroll(courseId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Berhasil mendaftar ke $courseName')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(
                  e.toString().replaceFirst('Exception: ', ''))),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Daftar Kursus'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Cari kursus...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _loadCourses();
                        },
                      )
                    : null,
              ),
              onSubmitted: (_) => _loadCourses(),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(_error!),
                            const SizedBox(height: 8),
                            ElevatedButton(
                              onPressed: () => _loadCourses(),
                              child: const Text('Coba Lagi'),
                            ),
                          ],
                        ),
                      )
                    : _courses.isEmpty
                        ? const Center(
                            child: Text('Tidak ada kursus'),
                          )
                        : RefreshIndicator(
                            onRefresh: _loadCourses,
                            child: ListView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: _courses.length,
                              itemBuilder: (context, index) {
                                final course = _courses[index];
                                return Card(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  elevation: 2,
                                  child: ListTile(
                                    contentPadding: const EdgeInsets.symmetric(
                                        horizontal: 16, vertical: 8),
                                    leading: CircleAvatar(
                                      backgroundColor:
                                          Theme.of(context)
                                              .colorScheme
                                              .primary
                                              .withOpacity(0.1),
                                      child: Text(
                                        course.courseCode.substring(
                                            0,
                                            course.courseCode.length < 4
                                                ? course.courseCode.length
                                                : 4),
                                        style: TextStyle(
                                          color: Theme.of(context)
                                              .colorScheme
                                              .primary,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                    title: Text(
                                      course.courseName,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.bold),
                                    ),
                                    subtitle: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(course.courseCode),
                                        if (course.faculty.isNotEmpty)
                                          Text(course.faculty,
                                              style: TextStyle(
                                                  color: Colors.grey[600],
                                                  fontSize: 12)),
                                      ],
                                    ),
                                    trailing: IconButton(
                                      icon: const Icon(Icons.add_circle),
                                      color: Colors.green,
                                      onPressed: () => _enroll(
                                          course.id, course.courseName),
                                    ),
                                    onTap: () => Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => CourseDetailScreen(
                                            courseId: course.id),
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}
