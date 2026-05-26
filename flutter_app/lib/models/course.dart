class Course {
  final int id;
  final String courseCode;
  final String courseName;
  final String faculty;

  Course({
    required this.id,
    required this.courseCode,
    required this.courseName,
    required this.faculty,
  });

  factory Course.fromJson(Map<String, dynamic> json) => Course(
        id: json['id'],
        courseCode: json['course_code'],
        courseName: json['course_name'],
        faculty: json['faculty'] ?? '',
      );
}
