import '../models/course.dart';
import 'api_client.dart';

class CourseService {
  static Future<List<Course>> getCourses({String? search}) async {
    String path = '/courses';
    if (search != null && search.isNotEmpty) {
      path += '?search=${Uri.encodeComponent(search)}';
    }
    final data = await ApiClient.get(path);
    final courses =
        (data['courses'] as List).map((c) => Course.fromJson(c)).toList();
    return courses;
  }

  static Future<Course> getCourse(int id) async {
    final data = await ApiClient.get('/courses/$id');
    return Course.fromJson(data['course']);
  }

  static Future<Map<String, dynamic>> getCourseDetail(int id) async {
    final data = await ApiClient.get('/courses/$id');
    return data;
  }

  static Future<dynamic> enroll(int courseId) async {
    return await ApiClient.post('/courses/$courseId/enroll');
  }

  static Future<List<Course>> getMyCourses() async {
    try {
      final data = await ApiClient.get('/users/me/courses');
      return (data['courses'] as List)
          .map((c) => Course.fromJson(c))
          .toList();
    } catch (_) {
      return [];
    }
  }
}
