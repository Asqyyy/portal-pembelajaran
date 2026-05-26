import '../models/forum.dart';
import 'api_client.dart';

class ForumService {
  static Future<List<ForumThread>> getThreads(int courseId) async {
    final data = await ApiClient.get('/courses/$courseId/forum');
    return (data['threads'] as List)
        .map((t) => ForumThread.fromJson(t))
        .toList();
  }

  static Future<ForumThread> getThread(int threadId) async {
    final data = await ApiClient.get('/forum/$threadId');
    return ForumThread.fromJson(data['thread']);
  }

  static Future<ForumThread> createThread(
      int courseId, String title, String content) async {
    final data = await ApiClient.post('/courses/$courseId/forum', body: {
      'title': title,
      'content': content,
    });
    return ForumThread.fromJson(data['thread']);
  }

  static Future<ForumReply> createReply(int threadId, String content) async {
    final data = await ApiClient.post('/forum/$threadId/reply', body: {
      'content': content,
    });
    return ForumReply.fromJson(data['reply']);
  }
}
