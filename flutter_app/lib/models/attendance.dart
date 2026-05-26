class AttendanceRecord {
  final int id;
  final int courseId;
  final String courseName;
  final String date;
  final String status;

  AttendanceRecord({
    required this.id,
    required this.courseId,
    required this.courseName,
    required this.date,
    required this.status,
  });

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) =>
      AttendanceRecord(
        id: json['id'],
        courseId: json['course_id'] ?? json['courseId'] ?? 0,
        courseName: json['course_name'] ?? json['courseName'] ?? '',
        date: json['date'] ?? '',
        status: json['status'] ?? 'present',
      );
}

class QRSession {
  final String token;
  final int courseId;
  final String? expiresAt;

  QRSession({
    required this.token,
    required this.courseId,
    this.expiresAt,
  });

  factory QRSession.fromJson(Map<String, dynamic> json) => QRSession(
        token: json['token'],
        courseId: json['course_id'] ?? json['courseId'] ?? 0,
        expiresAt: json['expires_at'] ?? json['expiresAt'],
      );
}
