import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// BMAD Phase 5: Implement
/// Authentication provider for user session management
/// BMAD Principle: Seamless authentication improves user retention
class AuthProvider with ChangeNotifier {
  static const _secureStorage = FlutterSecureStorage();

  bool _isAuthenticated = false;
  String? _userId;
  String? _token;
  String? _email;
  String? _name;
  String? _phone;
  bool _isLoading = false;
  String? _error;

  bool get isAuthenticated => _isAuthenticated;
  String? get userId => _userId;
  String? get token => _token;
  String? get email => _email;
  String? get name => _name;
  String? get phone => _phone;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadAuthState() async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final token = await _secureStorage.read(key: 'auth_token');
      final userId = await _secureStorage.read(key: 'user_id');

      if (token != null && userId != null) {
        _token = token;
        _userId = userId;
        _isAuthenticated = true;
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<bool> login({required String email, required String password}) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      await Future.delayed(const Duration(seconds: 1));

      _token = 'mock_token_${DateTime.now().millisecondsSinceEpoch}';
      _userId = 'user_${DateTime.now().millisecondsSinceEpoch}';
      _email = email;
      _isAuthenticated = true;

      await _secureStorage.write(key: 'auth_token', value: _token!);
      await _secureStorage.write(key: 'user_id', value: _userId!);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_email', email);

      _isLoading = false;
      notifyListeners();

      return true;
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      await Future.delayed(const Duration(seconds: 1));

      _token = 'mock_token_${DateTime.now().millisecondsSinceEpoch}';
      _userId = 'user_${DateTime.now().millisecondsSinceEpoch}';
      _name = name;
      _email = email;
      _phone = phone;
      _isAuthenticated = true;

      await _secureStorage.write(key: 'auth_token', value: _token!);
      await _secureStorage.write(key: 'user_id', value: _userId!);

      _isLoading = false;
      notifyListeners();

      return true;
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    try {
      _isLoading = true;
      notifyListeners();

      await _secureStorage.delete(key: 'auth_token');
      await _secureStorage.delete(key: 'user_id');

      _isAuthenticated = false;
      _token = null;
      _userId = null;
      _email = null;
      _name = null;
      _phone = null;

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
