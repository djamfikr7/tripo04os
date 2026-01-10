# Firebase Integration Guide

Complete guide for integrating Firebase with Tripo04OS platform for authentication, push notifications, and analytics.

## Overview

Firebase provides:
- **Authentication**: Email/password, Google, Apple, phone auth
- **Cloud Firestore**: Real-time database for user profiles and settings
- **Cloud Messaging (FCM)**: Push notifications for riders and drivers
- **Analytics**: User behavior tracking and crash reporting
- **Cloud Storage**: User-uploaded images and documents
- **Remote Config**: Feature flags and A/B testing

## Architecture

```
[Mobile Apps & Web]
        ↓
[Firebase SDKs]
        ↓
[Firebase Services]
    ├─ Authentication
    ├─ Cloud Firestore
    ├─ Cloud Messaging
    ├─ Analytics
    └─ Cloud Storage
        ↓
[Tripo04OS Backend]
        ↓
[API Gateway]
```

## Setup

### 1. Create Firebase Project

```bash
# 1. Go to Firebase Console
# https://console.firebase.google.com/

# 2. Click "Add project"

# 3. Configure project
# - Project name: tripo04os-production
# - Google Analytics: Enable
# - Default account for Firebase: Create new account

# 4. Create project
```

### 2. Add Firebase to Flutter Apps

#### Rider App

```bash
cd user_mobile_app_rider_flutter
flutter pub add firebase_core
flutter pub add firebase_auth
flutter pub add cloud_firestore
flutter pub add firebase_messaging
flutter pub add firebase_analytics
flutter pub add firebase_storage
```

#### Driver App

```bash
cd driver_mobile_app_flutter
flutter pub add firebase_core
flutter pub add firebase_auth
flutter pub add cloud_firestore
flutter pub add firebase_messaging
firebase_analytics
```

### 3. Add Firebase to React Apps

#### Admin Dashboard

```bash
cd admin_dashboard_react
npm install firebase
npm install @firebase/app
```

#### Web Interface

```bash
cd web_interface_react
npm install firebase
npm install @firebase/app
```

## Authentication

### Firebase Config

Create `lib/config/firebase_config.dart`:

```dart
// user_mobile_app_rider_flutter/lib/config/firebase_config.dart
class FirebaseConfig {
  static const Map<String, String> config = {
    'apiKey': 'YOUR_API_KEY',
    'authDomain': 'tripo04os.firebaseappapp.com',
    'projectId': 'tripo04os-production',
    'storageBucket': 'tripo04os.appspot.com',
    'messagingSenderId': 'YOUR_SENDER_ID',
    'appId': 'YOUR_APP_ID',
    'measurementId': 'YOUR_MEASUREMENT_ID',
  };
}
```

### Initialize Firebase

```dart
// user_mobile_app_rider_flutter/lib/main.dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'config/firebase_config.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Firebase.initializeApp(
    options: FirebaseConfiguration.fromMap(FirebaseConfig.config),
  );
  
  runApp(const Tripo04OSApp());
}
```

### Authentication Provider

```dart
// user_mobile_app_rider_flutter/lib/providers/auth_provider.dart
import 'package:firebase_auth/firebase_auth.dart';

class AuthProvider extends ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  
  User? _user;
  bool _isLoading = false;
  String? _errorMessage;
  
  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _user != null;
  
  AuthProvider() {
    _user = _auth.currentUser;
    _auth.authStateChanges().listen((User? user) {
      _user = user;
      notifyListeners();
    });
  }
  
  Future<void> signInWithEmailAndPassword({
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    
    try {
      await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
    } on FirebaseAuthException catch (e) {
      _errorMessage = e.message;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> createUserWithEmailAndPassword({
    required String email,
    required String password,
    required String name,
    required String phone,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    
    try {
      final credential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      await credential.user?.updateDisplayName(name);
      
      // Store additional user data in Firestore
      await FirebaseFirestore.instance
          .collection('users')
          .doc(credential.user!.uid)
          .set({
        'email': email,
        'name': name,
        'phone': phone,
        'role': 'rider',
        'createdAt': FieldValue.serverTimestamp(),
      });
    } on FirebaseAuthException catch (e) {
      _errorMessage = e.message;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  Future<void> signOut() async {
    await _auth.signOut();
  }
}
```

## Cloud Firestore

### Database Structure

```dart
// Users Collection
{
  'users': {
    '{userId}': {
      'email': 'user@example.com',
      'name': 'John Doe',
      'phone': '+1234567890',
      'role': 'rider',
      'avatarUrl': 'https://...',
      'createdAt': Timestamp(),
      'updatedAt': Timestamp(),
    }
  }
}

// Orders Collection
{
  'orders': {
    '{orderId}': {
      'riderId': '{userId}',
      'driverId': '{driverId}',
      'serviceType': 'ride',
      'status': 'pending',
      'pickupLocation': GeoPoint(),
      'dropoffLocation': GeoPoint(),
      'fare': 15.50,
      'createdAt': Timestamp(),
    }
  }
}

// Trips Collection
{
  'trips': {
    '{tripId}': {
      'riderId': '{userId}',
      'driverId': '{driverId}',
      'orderId': '{orderId}',
      'status': 'in_progress',
      'startTime': Timestamp(),
      'endTime': Timestamp(),
      'route': [GeoPoint(), GeoPoint()],
    }
  }
}
```

### Firestore Service

```dart
// user_mobile_app_rider_flutter/lib/services/firestore_service.dart
import 'package:cloud_firestore/cloud_firestore.dart';

class FirestoreService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  // User operations
  Future<void> updateUserProfile({
    required String userId,
    required Map<String, dynamic> data,
  }) async {
    await _firestore
        .collection('users')
        .doc(userId)
        .update(data);
  }
  
  Future<DocumentSnapshot> getUserProfile(String userId) async {
    return await _firestore
        .collection('users')
        .doc(userId)
        .get();
  }
  
  // Order operations
  Future<void> createOrder(Map<String, dynamic> orderData) async {
    await _firestore
        .collection('orders')
        .add(orderData);
  }
  
  Future<QuerySnapshot> getOrders(String userId, {int limit = 10}) async {
    return await _firestore
        .collection('orders')
        .where('riderId', isEqualTo: userId)
        .orderBy('createdAt', descending: true)
        .limit(limit)
        .get();
  }
  
  // Trip operations
  Future<void> createTrip(Map<String, dynamic> tripData) async {
    await _firestore
        .collection('trips')
        .add(tripData);
  }
  
  Stream<QuerySnapshot> streamActiveTrips(String driverId) {
    return _firestore
        .collection('trips')
        .where('driverId', isEqualTo: driverId)
        .where('status', isEqualTo: 'in_progress')
        .snapshots();
  }
}
```

## Cloud Messaging (FCM)

### Configure FCM

```bash
# 1. In Firebase Console
# - Navigate to Project Settings > Cloud Messaging
# - Add Android app (APK key or SHA-1 fingerprint)
# - Add iOS app (APNs key)
# - Add Web app (VAPID key)

# 2. Get server key
# - Cloud Messaging API (Legacy) tab
# - Copy Server Key
```

### Initialize FCM (Flutter)

```dart
// user_mobile_app_rider_flutter/lib/services/fcm_service.dart
import 'package:firebase_messaging/firebase_messaging.dart';

class FCMService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  
  Future<void> initialize() async {
    // Request permission
    NotificationSettings settings = await _messaging.requestPermission();
    
    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      String? token = await _messaging.getToken();
      print('FCM Token: $token');
      
      // Save token to Firestore
      await _saveTokenToDatabase(token);
    }
  }
  
  Future<void> _saveTokenToDatabase(String? token) async {
    if (token != null) {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        await FirebaseFirestore.instance
            .collection('users')
            .doc(user.uid)
            .update({'fcmToken': token});
      }
    }
  }
  
  Future<void> subscribeToTopic(String topic) async {
    await _messaging.subscribeToTopic(topic);
    print('Subscribed to topic: $topic');
  }
  
  Future<void> unsubscribeFromTopic(String topic) async {
    await _messaging.unsubscribeFromTopic(topic);
    print('Unsubscribed from topic: $topic');
  }
}
```

### Handle Notifications

```dart
// user_mobile_app_rider_flutter/lib/main.dart
import 'package:firebase_messaging/firebase_messaging.dart';

Future<void> _setupMessageHandlers() async {
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    // Handle foreground message
    print('Received message: ${message.notification?.body}');
    
    // Show in-app notification
    _showInAppNotification(message);
  });
  
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    // Handle background tap
    print('Message opened from background: ${message.data}');
    
    // Navigate to appropriate screen
    _handleMessageTap(message.data);
  });
}
```

### Send Notifications (Backend)

```typescript
// backend_services/notification_service/routes.go
package main

import (
  "github.com/appleboy/gin"
  firebase.google.com/go/v4/messaging"
)

func sendNotification(c *gin.Context) {
  var req struct {
    Token   string `json:"token"`
    Title   string `json:"title"`
    Body    string `json:"body"`
    Data    map[string]string `json:"data"`
  }
  
  if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(400, gin.H{"error": err.Error()})
    return
  }
  
  // Create message
  msg := &messaging.Message{
    Token: req.Token,
    Notification: &messaging.Notification{
      Title: req.Title,
      Body:  req.Body,
    },
    Data: req.Data,
  }
  
  // Send message
  client, err := messaging.NewClient(context.Background(), "YOUR_FIREBASE_PROJECT_ID")
  if err != nil {
    c.JSON(500, gin.H{"error": err.Error()})
    return
  }
  
  response, err := client.Send(context.Background(), msg)
  if err != nil {
    c.JSON(500, gin.H{"error": err.Error()})
    return
  }
  
  c.JSON(200, gin.H{"success": true, "messageId": response})
}
```

## Cloud Storage

### Configure Storage

```bash
# 1. In Firebase Console
# - Navigate to Storage
# - Set up security rules
```

### Storage Rules

```
rules_version = '2';
service firebase.storage {
  match /b/{allPaths=**} {
    match /b/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /b/public/{allPaths=**} {
      allow read;
    }
  }
}
```

### Upload Files (Flutter)

```dart
// user_mobile_app_rider_flutter/lib/services/storage_service.dart
import 'package:firebase_storage/firebase_storage.dart';

class StorageService {
  final FirebaseStorage _storage = FirebaseStorage.instance;
  
  Future<String> uploadProfileImage({
    required String userId,
    required File imageFile,
  }) async {
    final ref = _storage.ref().child('users/$userId/profile.jpg');
    final uploadTask = ref.putFile(imageFile.path);
    final snapshot = await uploadTask;
    final downloadUrl = await snapshot.ref.getDownloadURL();
    return downloadUrl;
  }
  
  Future<String> uploadDocument({
    required String userId,
    required File documentFile,
    required String documentType,
  }) async {
    final fileName = '${DateTime.now().millisecondsSinceEpoch}_${documentType}';
    final ref = _storage.ref().child('users/$userId/documents/$fileName');
    final uploadTask = ref.putFile(documentFile.path);
    final snapshot = await uploadTask;
    final downloadUrl = await snapshot.ref.getDownloadURL();
    return downloadUrl;
  }
  
  Future<void> deleteFile(String fileUrl) async {
    final ref = _storage.refFromURL(fileUrl);
    await ref.delete();
  }
}
```

## Analytics

### Initialize Analytics

```dart
// user_mobile_app_rider_flutter/lib/main.dart
import 'package:firebase_analytics/firebase_analytics.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // Initialize Analytics
  FirebaseAnalytics analytics = FirebaseAnalytics.instance;
  
  runApp(const Tripo04OSApp());
}
```

### Track Events

```dart
// Track screen view
FirebaseAnalytics.instance.logEvent(
  name: 'screen_view',
  parameters: {
    'screen_name': 'ride_history',
  },
);

// Track ride booked
FirebaseAnalytics.instance.logEvent(
  name: 'ride_booked',
  parameters: {
    'service_type': 'ride',
    'vehicle_type': 'economy',
    'fare_estimate': 15.50,
  },
);

// Track ride completed
FirebaseAnalytics.instance.logEvent(
  name: 'ride_completed',
  parameters: {
    'duration': 12,
    'distance': 5.2,
    'fare': 15.50,
    'rating': 5,
  },
);
```

### Custom Events

```dart
// Track driver accepted
FirebaseAnalytics.instance.logEvent(
  name: 'driver_accepted',
  parameters: {
    'driver_id': 'driver123',
    'eta_minutes': 3,
  },
);

// Track cancellation
FirebaseAnalytics.instance.logEvent(
  name: 'ride_cancelled',
  parameters: {
    'reason': 'changed_mind',
    'time_before_cancellation': 30,
  },
);
```

## Remote Config

### Configure Remote Config

```bash
# 1. In Firebase Console
# - Navigate to Remote Config
# - Add parameters
#   - min_trip_rating: 3
#   - max_trip_distance_km: 50
#   - enable_surge_pricing: true
```

### Fetch Remote Config (Flutter)

```dart
// user_mobile_app_rider_flutter/lib/services/remote_config_service.dart
import 'package:firebase_remote_config/firebase_remote_config.dart';

class RemoteConfigService {
  final FirebaseRemoteConfig _remoteConfig = FirebaseRemoteConfig.instance;
  
  Future<void> initialize() async {
    await _remoteConfig.setConfigSettings(RemoteConfigSettings(
      fetchTimeout: const Duration(minutes: 1),
      minimumFetchInterval: const Duration(hours: 1),
    ));
    await _remoteConfig.fetchAndActivate();
  }
  
  int get minTripRating => _remoteConfig.getInt('min_trip_rating');
  int get maxTripDistanceKm => _remoteConfig.getInt('max_trip_distance_km');
  bool get enableSurgePricing => _remoteConfig.getBool('enable_surge_pricing');
}
```

## Security

### Security Rules (Firestore)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null;
      
      // Only user can read/write their own data
      allow read, write: if request.auth.uid == userId;
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.riderId 
                      || request.auth.uid == resource.data.driverId;
    }
    
    // Trips collection
    match /trips/{tripId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.driverId;
    }
  }
}
```

### Security Rules (Storage)

```
rules_version = '2';
service firebase.storage {
  match /b/{allPaths=**} {
    match /b/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /b/public/{allPaths=**} {
      allow read: if request.auth != null;
    }
    match /b/app-assets/{allPaths=**} {
      allow read: if true;
    }
  }
}
```

## Monitoring

### Crash Reporting

```bash
# 1. Add Crashlytics to Flutter apps
flutter pub add firebase_crashlytics

# 2. Configure in main.dart
import 'package:firebase_crashlytics/firebase_crashlytics.dart';

await FirebaseCrashlytics.instance.setCrashlyticsCollectionEnabled(true);
```

### Performance Monitoring

```bash
# 1. Add Performance plugin
flutter pub add firebase_performance

# 2. Enable in main.dart
import 'package:firebase_performance/firebase_performance.dart';

await FirebasePerformance.instance.setPerformanceCollectionEnabled(true);
```

## Troubleshooting

### FCM Token Issues

```bash
# Check token validity
# 1. In Firebase Console
# - Cloud Messaging > Devices
# - Verify token is present

# 2. Regenerate token
await FirebaseMessaging.instance.deleteToken();
String? newToken = await FirebaseMessaging.instance.getToken();
```

### Authentication Issues

```bash
# Check Firebase Console
# - Authentication > Users
# - Verify user exists
# - Check authentication method

# Enable additional auth providers
# - Email/Password: Default
# - Google: Enable in Firebase Console
# - Apple: Enable for iOS
# - Phone: Configure Twilio
```

### Firestore Permissions

```bash
# Check Firestore rules
# 1. In Firebase Console
# - Firestore > Rules
# - Test rules using Simulator

# Verify user is authenticated
print('User authenticated: ${FirebaseAuth.instance.currentUser != null}');
```

## Best Practices

1. **Use Authentication on Client**
   - Firebase Auth handles auth on client
   - Backend validates Firebase tokens
   - Never handle passwords in backend

2. **Structure Data Efficiently**
   - Use collections and subcollections
   - Index frequently queried fields
   - Denormalize when necessary

3. **Optimize FCM Tokens**
   - Refresh tokens regularly
   - Handle token refresh in background
   - Remove invalid tokens

4. **Monitor Usage**
   - Set up Crashlytics for crash reports
   - Use Performance Monitoring
   - Review Analytics dashboards

5. **Secure Your Rules**
   - Test Firestore rules with Simulator
   - Use least-privilege principle
   - Regularly audit security rules

## Next Steps

1. **Deploy to Production**
   - Create production Firebase project
   - Configure all services
   - Update app configs

2. **Integrate with Backend**
   - Validate Firebase tokens in backend
   - Send notifications from backend
   - Sync Firestore with PostgreSQL

3. **Set Up Monitoring**
   - Configure Crashlytics
   - Enable Performance Monitoring
   - Set up Analytics dashboards

## Support

For Firebase integration issues:
- Firebase Console: https://console.firebase.google.com/
- Firebase Documentation: https://firebase.google.com/docs
- FlutterFire GitHub: https://github.com/FirebaseExtended/flutterfire

## License

Proprietary - Tripo04OS Internal Use Only

---

**End of Firebase Integration Guide**
