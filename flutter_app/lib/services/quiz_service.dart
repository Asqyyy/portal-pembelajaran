import '../models/quiz.dart';
import 'api_client.dart';

class QuizService {
  static Future<List<Quiz>> getQuizzes(int courseId) async {
    final data = await ApiClient.get('/courses/$courseId/quiz');
    return (data['quizzes'] as List).map((q) => Quiz.fromJson(q)).toList();
  }

  static Future<Quiz> getQuiz(int quizId) async {
    final data = await ApiClient.get('/quiz/$quizId');
    return Quiz.fromJson(data['quiz']);
  }

  static Future<QuizResult> submitQuiz(int quizId, List<int> answers) async {
    final data = await ApiClient.post('/quiz/$quizId/submit', body: {
      'answers': answers,
    });
    return QuizResult.fromJson(data['result'] ?? data);
  }

  static Future<QuizResult> getResult(int quizId) async {
    final data = await ApiClient.get('/quiz/$quizId/result');
    return QuizResult.fromJson(data['result'] ?? data);
  }
}
