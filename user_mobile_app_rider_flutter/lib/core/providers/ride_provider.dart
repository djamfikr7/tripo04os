import 'package:flutter/foundation.dart';

import '../models/ride_models.dart';

/// BMAD Phase 5: Implement
/// Ride provider for active ride management
/// BMAD Principle: Real-time ride updates enhance user trust
class RideProvider with ChangeNotifier {
  Ride? _activeRide;
  List<Ride> _rideHistory = [];
  bool _isLoading = false;
  String? _error;

  Ride? get activeRide => _activeRide;
  List<Ride> get rideHistory => _rideHistory;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> checkActiveRide() async {
    try {
      _isLoading = true;
      notifyListeners();

      await Future.delayed(const Duration(milliseconds: 500));

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> startRideTracking(String rideId) async {
    try {
      _isLoading = true;
      notifyListeners();

      await Future.delayed(const Duration(seconds: 1));

      _activeRide = Ride(
        rideId: rideId,
        status: RideStatus.driverAssigned,
        pickupLocation: Location(
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St, New York, NY',
        ),
        dropoffLocation: Location(
          latitude: 40.7580,
          longitude: -73.9855,
          address: '456 Broadway, New York, NY',
        ),
        serviceType: ServiceType.ride,
        vehicleType: VehicleType.sedan,
        etaMinutes: 8,
        distanceRemainingKm: 5.2,
        fareEstimate: 25.50,
        driverInfo: DriverInfo(
          driverId: 'driver_1',
          name: 'John Doe',
          phone: '+1 234 567 8900',
          rating: 4.8,
          totalRides: 1250,
          vehicleType: 'Toyota Camry',
          vehiclePlate: 'ABC-1234',
          vehicleColor: 'Silver',
        ),
        createdAt: DateTime.now(),
      );

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }

  void updateRideStatus(RideStatus status) {
    if (_activeRide != null) {
      _activeRide = _activeRide!.copyWith(status: status);

      if (status == RideStatus.inProgress) {
        _activeRide = _activeRide!.copyWith(startedAt: DateTime.now());
      } else if (status == RideStatus.completed) {
        _activeRide = _activeRide!.copyWith(completedAt: DateTime.now());
        _addToHistory(_activeRide!);
        _activeRide = null;
      } else if (status == RideStatus.cancelled) {
        _activeRide = _activeRide!.copyWith(cancelledAt: DateTime.now());
        _activeRide = null;
      }

      notifyListeners();
    }
  }

  void updateDriverLocation(Location location) {
    if (_activeRide != null) {
      _activeRide = _activeRide!.copyWith(currentLocation: location);
      notifyListeners();
    }
  }

  Future<void> loadRideHistory() async {
    try {
      _isLoading = true;
      notifyListeners();

      await Future.delayed(const Duration(milliseconds: 500));

      _rideHistory = [
        Ride(
          rideId: 'ride_h1',
          status: RideStatus.completed,
          pickupLocation: Location(
            latitude: 40.7128,
            longitude: -74.0060,
            address: '123 Main St, New York, NY',
          ),
          dropoffLocation: Location(
            latitude: 40.7580,
            longitude: -73.9855,
            address: '456 Broadway, New York, NY',
          ),
          serviceType: ServiceType.ride,
          vehicleType: VehicleType.sedan,
          etaMinutes: 0,
          distanceRemainingKm: 0,
          fareEstimate: 25.50,
          createdAt: DateTime.now().subtract(const Duration(days: 1)),
          startedAt: DateTime.now()
              .subtract(const Duration(days: 1))
              .add(const Duration(minutes: 5)),
          completedAt: DateTime.now()
              .subtract(const Duration(days: 1))
              .add(const Duration(minutes: 25)),
        ),
        Ride(
          rideId: 'ride_h2',
          status: RideStatus.completed,
          pickupLocation: Location(
            latitude: 40.7128,
            longitude: -74.0060,
            address: '123 Main St, New York, NY',
          ),
          dropoffLocation: Location(
            latitude: 40.7614,
            longitude: -73.9776,
            address: '789 5th Ave, New York, NY',
          ),
          serviceType: ServiceType.moto,
          vehicleType: VehicleType.moto,
          etaMinutes: 0,
          distanceRemainingKm: 0,
          fareEstimate: 12.00,
          createdAt: DateTime.now().subtract(const Duration(days: 3)),
          startedAt: DateTime.now()
              .subtract(const Duration(days: 3))
              .add(const Duration(minutes: 3)),
          completedAt: DateTime.now()
              .subtract(const Duration(days: 3))
              .add(const Duration(minutes: 15)),
        ),
      ];

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> rateRide({
    required String rideId,
    required int rating,
    required String comment,
  }) async {
    try {
      _isLoading = true;
      notifyListeners();

      await Future.delayed(const Duration(seconds: 1));

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> cancelRide(String rideId) async {
    try {
      _isLoading = true;
      notifyListeners();

      await Future.delayed(const Duration(seconds: 1));

      updateRideStatus(RideStatus.cancelled);

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }

  void _addToHistory(Ride ride) {
    _rideHistory.insert(0, ride);
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
