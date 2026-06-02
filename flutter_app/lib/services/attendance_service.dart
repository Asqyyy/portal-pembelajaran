import '../models/attendance.dart';
import 'api_client.dart';

class AttendanceService {
  static Future<QRSession> generateQR(String courseCode) async {
    final data = await ApiClient.post('/attendance/generate', body: {
      'course_code': courseCode,
    });
    return QRSession.fromJson(data['session'] ?? data);
  }

  static Future<dynamic> recordAttendance(String courseCode, String token) async {
    return await ApiClient.post('/attendance/record', body: {
      'course_code': courseCode,
      'token': token,
    });
  }

  static Future<List<AttendanceRecord>> getRecords(String courseCode) async {
    final data = await ApiClient.get('/attendance/course/$courseCode');
    return (data['records'] as List)
        .map((r) => AttendanceRecord.fromJson(r))
        .toList();
  }
}
