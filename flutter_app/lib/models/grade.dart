class GradeComponent {
  final int id;
  final int courseId;
  final String name;
  final double weight;
  final double? score;

  GradeComponent({
    required this.id,
    required this.courseId,
    required this.name,
    required this.weight,
    this.score,
  });

  factory GradeComponent.fromJson(Map<String, dynamic> json) =>
      GradeComponent(
        id: json['id'],
        courseId: json['course_id'] ?? json['courseId'] ?? 0,
        name: json['name'],
        weight: (json['weight'] ?? 0).toDouble(),
        score: json['score'] != null ? (json['score']).toDouble() : null,
      );
}

class Gradebook {
  final int courseId;
  final String courseName;
  final List<GradeComponent> components;
  final double? finalScore;
  final String? letterGrade;

  Gradebook({
    required this.courseId,
    required this.courseName,
    required this.components,
    this.finalScore,
    this.letterGrade,
  });

  factory Gradebook.fromJson(Map<String, dynamic> json) => Gradebook(
        courseId: json['course_id'] ?? json['courseId'] ?? 0,
        courseName: json['course_name'] ?? json['courseName'] ?? '',
        components: json['components'] != null
            ? (json['components'] as List)
                .map((c) => GradeComponent.fromJson(c))
                .toList()
            : [],
        finalScore: json['final_score'] != null
            ? (json['final_score']).toDouble()
            : null,
        letterGrade: json['letter_grade'] ?? json['letterGrade'],
      );
}
