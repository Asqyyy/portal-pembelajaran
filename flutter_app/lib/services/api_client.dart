import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config.dart';

class ApiClient {
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('ppToken');
  }

  static Future<Map<String, String>> _headers() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<dynamic> get(String path) async {
    final response = await http.get(
      Uri.parse('${AppConfig.apiBaseUrl}$path'),
      headers: await _headers(),
    );
    final data = jsonDecode(response.body);
    if (response.statusCode == 401) throw Exception('Sesi telah berakhir. Silakan login kembali.');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Request gagal');
    }
    return data;
  }

  static Future<dynamic> post(String path, {Map<String, dynamic>? body}) async {
    final response = await http.post(
      Uri.parse('${AppConfig.apiBaseUrl}$path'),
      headers: await _headers(),
      body: body != null ? jsonEncode(body) : null,
    );
    final data = jsonDecode(response.body);
    if (response.statusCode == 401) throw Exception('Sesi telah berakhir. Silakan login kembali.');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Request gagal');
    }
    return data;
  }

  static Future<dynamic> put(String path, {Map<String, dynamic>? body}) async {
    final response = await http.put(
      Uri.parse('${AppConfig.apiBaseUrl}$path'),
      headers: await _headers(),
      body: body != null ? jsonEncode(body) : null,
    );
    final data = jsonDecode(response.body);
    if (response.statusCode == 401) throw Exception('Sesi telah berakhir. Silakan login kembali.');
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Request gagal');
    }
    return data;
  }

  static Future<dynamic> delete(String path) async {
    final response = await http.delete(
      Uri.parse('${AppConfig.apiBaseUrl}$path'),
      headers: await _headers(),
    );
    final data = jsonDecode(response.body);
    if (response.statusCode >= 400) {
      throw Exception(data['error'] ?? 'Request gagal');
    }
    return data;
  }
}
