import 'dart:convert';
import '../models/user.dart';
import 'api_client.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  static Future<User> login(String username, String password) async {
    final data = await ApiClient.post('/auth/login', body: {
      'username': username,
      'password': password,
    });
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('ppToken', data['token']);
    await prefs.setString('ppUser', jsonEncode(data['user']));
    return User.fromJson(data['user']);
  }

  static Future<void> register(
      String username, String password, String email) async {
    await ApiClient.post('/auth/register', body: {
      'username': username,
      'password': password,
      'email': email,
    });
  }

  static Future<User?> getMe() async {
    try {
      final data = await ApiClient.get('/auth/me');
      return User.fromJson(data['user']);
    } catch (e) {
      return null;
    }
  }

  static Future<User?> getSavedUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString('ppUser');
      if (userJson != null) {
        return User.fromJson(jsonDecode(userJson));
      }
    } catch (_) {}
    return null;
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('ppToken');
    await prefs.remove('ppUser');
  }
}
