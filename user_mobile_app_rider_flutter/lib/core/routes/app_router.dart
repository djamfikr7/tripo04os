import 'package:flutter/material.dart';

import '../screens/home/home_screen.dart';
import '../screens/history/ride_history_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/tracking/ride_tracking_screen.dart';

/// BMAD Phase 5: Implement
/// App router for navigation
/// BMAD Principle: Streamlined navigation improves user experience
class AppRouter {
  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case '/':
        return MaterialPageRoute(builder: (_) => const HomeScreen());
      case '/history':
        return MaterialPageRoute(builder: (_) => const RideHistoryScreen());
      case '/profile':
        return MaterialPageRoute(builder: (_) => const ProfileScreen());
      default:
        return MaterialPageRoute(builder: (_) => const HomeScreen());
    }
  }

  static void navigateToHome(BuildContext context) {
    Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
  }

  static void navigateToHistory(BuildContext context) {
    Navigator.pushNamed(context, '/history');
  }

  static void navigateToProfile(BuildContext context) {
    Navigator.pushNamed(context, '/profile');
  }

  static void navigateToRideTracking(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const RideTrackingScreen()),
    );
  }
}
