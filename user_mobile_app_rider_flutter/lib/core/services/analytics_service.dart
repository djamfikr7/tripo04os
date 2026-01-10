import 'package:firebase_analytics/firebase_analytics.dart';

/// BMAD Phase 5: Implement
/// Analytics service for tracking user behavior
/// BMAD Principle: Analytics provide insights for optimization
class AnalyticsService {
  static final FirebaseAnalytics _analytics = FirebaseAnalytics.instance;

  static Future<void> initialize() async {
    await _analytics.setAnalyticsCollectionEnabled(true);
  }

  static Future<void> logEvent({
    required String name,
    Map<String, dynamic>? parameters,
  }) async {
    await _analytics.logEvent(name: name, parameters: parameters);
  }

  static Future<void> setUserId(String userId) async {
    await _analytics.setUserId(id: userId);
  }
}
