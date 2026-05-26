class Quiz {
  final int id;
  final int courseId;
  final String title;
  final String? description;
  final List<QuizQuestion>? questions;

  Quiz({
    required this.id,
    required this.courseId,
    required this.title,
    this.description,
    this.questions,
  });

  factory Quiz.fromJson(Map<String, dynamic> json) => Quiz(
        id: json['id'],
        courseId: json['course_id'] ?? json['courseId'] ?? 0,
        title: json['title'],
        description: json['description'],
        questions: json['questions'] != null
            ? (json['questions'] as List)
                .map((q) => QuizQuestion.fromJson(q))
                .toList()
            : null,
      );
}

class QuizQuestion {
  final int id;
  final String question;
  final List<String> options;
  final int? correctAnswer;

  QuizQuestion({
    required this.id,
    required this.question,
    required this.options,
    this.correctAnswer,
  });

  factory QuizQuestion.fromJson(Map<String, dynamic> json) => QuizQuestion(
        id: json['id'],
        question: json['question'],
        options: List<String>.from(json['options'] ?? []),
        correctAnswer: json['correct_answer'] ?? json['correctAnswer'],
      );
}

class QuizResult {
  final int score;
  final int total;
  final int correct;
  final int incorrect;

  QuizResult({
    required this.score,
    required this.total,
    required this.correct,
    required this.incorrect,
  });

  factory QuizResult.fromJson(Map<String, dynamic> json) => QuizResult(
        score: json['score'] ?? 0,
        total: json['total'] ?? 0,
        correct: json['correct'] ?? 0,
        incorrect: json['incorrect'] ?? 0,
      );
}
