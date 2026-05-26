import '../models/attendance.dart';
import 'api_client.dart';

class AttendanceService {
  static Future<QRSession> generateQR(int courseId) async {
    final data = await ApiClient.post('/courses/$courseId/attendance/qr');
    return QRSession.fromJson(data['session'] ?? data);
  }

  static Future<dynamic> recordAttendance(String token) async {
    return await ApiClient.post('/attendance/record', body: {
      'token': token,
    });
  }

  static Future<List<AttendanceRecord>> getRecords(int courseId) async {
    final data =
        await ApiClient.get('/courses/$courseId/attendance');
    return (data['records'] as List)
        .map((r) => AttendanceRecord.fromJson(r))
        .toList();
  }
}
