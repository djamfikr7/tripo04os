import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

import '../models/ride_models.dart';

/// BMAD Phase 5: Implement
/// Location provider for user location tracking
/// BMAD Principle: Accurate location tracking improves ride matching
class LocationProvider with ChangeNotifier {
  Location? _currentLocation;
  bool _isLoading = false;
  String? _error;
  Stream<Position>? _positionStream;

  Location? get currentLocation => _currentLocation;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Stream<Position>? get positionStream => _positionStream;

  Future<void> getCurrentLocation() async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _error = 'Location services are disabled';
        _isLoading = false;
        notifyListeners();
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          _error = 'Location permissions are denied';
          _isLoading = false;
          notifyListeners();
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        _error = 'Location permissions are permanently denied';
        _isLoading = false;
        notifyListeners();
        return;
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      _currentLocation = Location(
        latitude: position.latitude,
        longitude: position.longitude,
        timestamp: DateTime.now(),
      );

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }

  void startLocationUpdates() {
    const LocationSettings locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10,
    );

    _positionStream =
        Geolocator.getPositionStream(locationSettings: locationSettings).map((
          position,
        ) {
          _currentLocation = Location(
            latitude: position.latitude,
            longitude: position.longitude,
            timestamp: DateTime.now(),
          );
          notifyListeners();
          return position;
        });

    _positionStream?.listen((_) {});
  }

  void stopLocationUpdates() {
    _positionStream = null;
  }

  Future<double> getDistanceTo(Location targetLocation) async {
    if (_currentLocation == null) {
      await getCurrentLocation();
    }

    return _currentLocation?.distanceTo(targetLocation) ?? 0.0;
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
