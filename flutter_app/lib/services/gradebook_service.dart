import '../models/grade.dart';
import 'api_client.dart';

class GradebookService {
  static Future<Gradebook> getGradebook(int courseId) async {
    final data = await ApiClient.get('/courses/$courseId/gradebook');
    return Gradebook.fromJson(data['gradebook'] ?? data);
  }
}
