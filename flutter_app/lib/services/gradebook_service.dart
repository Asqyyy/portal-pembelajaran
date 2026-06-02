import '../models/grade.dart';
import 'api_client.dart';

class GradebookService {
  static Future<Gradebook> getGradebook(int courseId) async {
    final data = await ApiClient.get('/gradebook/course/$courseId');
    return Gradebook.fromJson(data['gradebook'] ?? data);
  }
}
