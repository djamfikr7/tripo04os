import 'package:flutter/foundation.dart';

import '../models/ride_models.dart';

/// BMAD Phase 5: Implement
/// Booking provider for ride booking management
/// BMAD Principle: Streamlined booking flow maximizes conversion
class BookingProvider with ChangeNotifier {
  List<Location> _recentLocations = [];
  List<Location> _favoriteLocations = [];
  List<dynamic> _promotions = [];
  List<dynamic> _paymentMethods = [];
  List<Ride> _scheduledRides = [];
  FareEstimate? _fareEstimate;

  bool _isLoading = false;
  String? _error;

  List<Location> get recentLocations => _recentLocations;
  List<Location> get favoriteLocations => _favoriteLocations;
  List<dynamic> get promotions => _promotions;
  List<dynamic> get paymentMethods => _paymentMethods;
  List<Ride> get scheduledRides => _scheduledRides;
  FareEstimate? get fareEstimate => _fareEstimate;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadRecentLocations() async {
    try {
      _isLoading = true;
      notifyListeners();

      await Future.delayed(const Duration(milliseconds: 500));

      _recentLocations = [
        Location(
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Main St, New York, NY',
          city: 'New York',
          country: 'USA',
        ),
        Location(
          latitude: 40.7580,
          longitude: -73.9855,
          address: '456 Broadway, New York, NY',
          city: 'New York',
          country: 'USA',
        ),
        Location(
          latitude: 40.7614,
          longitude: -73.9776,
          address: '789 5th Ave, New York, NY',
          city: 'New York',
          country: 'USA',
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

  Future<void> loadFavoriteLocations() async {
    try {
      _isLoading = true;
      notifyListeners();

      await Future.delayed(const Duration(milliseconds: 500));

      _favoriteLocations = [
        Location(
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'Home',
          city: 'New York',
          country: 'USA',
        ),
        Location(
          latitude: 40.7580,
          longitude: -73.9855,
          address: 'Work',
          city: 'New York',
          country: 'USA',
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

  Future<void> loadPromotions() async {
    try {
      _isLoading = true;
      notifyListeners();

      await Future.delayed(const Duration(milliseconds: 500));

      _promotions = [
        {
          'title': '20% Off Your Next Ride',
          'description': 'Valid for all rides this weekend',
          'discountPercentage': 20,
        },
        {
          'title': 'Free Delivery',
          'description': 'On orders over $25',
          'discountPercentage': 100,
        },
      ];

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> loadPaymentMethods() async {
    try {
      _isLoading = true;
      notifyListeners();

      await Future.delayed(const Duration(milliseconds: 500));

      _paymentMethods = [
        {
          'id': 'pm_1',
          'type': 'credit_card',
          'name': 'Visa ending in 4242',
          'isDefault': true,
        },
        {
          'id': 'pm_2',
          'type': 'paypal',
          'name': 'PayPal',
          'isDefault': false,
        },
      ];

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> loadScheduledRides() async {
    try {
      _isLoading = true;
      notifyListeners();

      await Future.delayed(const Duration(milliseconds: 500));

      _scheduledRides = [
        Ride(
          rideId: 'ride_1',
          status: RideStatus.searching,
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
          etaMinutes: 10,
          distanceRemainingKm: 5.2,
          fareEstimate: 25.50,
          scheduledTime: DateTime.now().add(const Duration(hours: 2)),
          createdAt: DateTime.now(),
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

  Future<void> getFareEstimate({
    required Location pickupLocation,
    required Location dropoffLocation,
    required ServiceType serviceType,
    required VehicleType vehicleType,
    String? promoCode,
  }) async {
    try {
      _isLoading = true;
      notifyListeners();

      await Future.delayed(const Duration(seconds: 1));

      final distanceKm = pickupLocation.distanceTo(dropoffLocation);
      final estimatedTimeMinutes = (distanceKm * 3).round();

      final baseFare = 15.0;
      final distanceFare = distanceKm * 1.5;
      final timeFare = estimatedTimeMinutes * 0.5;
      var totalFare = baseFare + distanceFare + timeFare;

      double? discount;
      if (promoCode != null && promoCode.toUpperCase() == 'SAVE20') {
        discount = totalFare * 0.2;
        totalFare -= discount!;
      }

      _fareEstimate = FareEstimate(
        baseFare: baseFare,
        distanceFare: distanceFare,
        timeFare: timeFare,
        totalFare: totalFare,
        distanceKm: distanceKm,
        estimatedTimeMinutes: estimatedTimeMinutes,
        discount: discount,
        promoCode: promoCode,
      );

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<bool> createBooking({
    required Location pickupLocation,
    required Location dropoffLocation,
    required ServiceType serviceType,
    required VehicleType vehicleType,
    DateTime? scheduledTime,
    List<String> specialRequests = const [],
    String? promoCode,
    String? paymentMethodId,
  }) async {
    try {
      _isLoading = true;
      notifyListeners();

      await Future.delayed(const Duration(seconds: 2));

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

  Future<void> applyPromoCode(String promoCode) async {
    try {
      _isLoading = true;
      notifyListeners();

      await Future.delayed(const Duration(seconds: 1));

      if (promoCode.toUpperCase() == 'SAVE20') {
        if (_fareEstimate != null) {
          final discount = _fareEstimate!.totalFare * 0.2;
          _fareEstimate = FareEstimate(
            baseFare: _fareEstimate!.baseFare,
            distanceFare: _fareEstimate!.distanceFare,
            timeFare: _fareEstimate!.timeFare,
            totalFare: _fareEstimate!.totalFare - discount,
            distanceKm: _fareEstimate!.distanceKm,
            estimatedTimeMinutes: _fareEstimate!.estimatedTimeMinutes,
            discount: discount,
            promoCode: promoCode,
          );
        }
      } else {
        _error = 'Invalid promo code';
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }

  void addFavoriteLocation(Location location) {
    if (_favoriteLocations.length < 10) {
      _favoriteLocations.add(location);
      notifyListeners();
    }
  }

  void removeFavoriteLocation(Location location) {
    _favoriteLocations.removeWhere(
      (loc) => loc.address == location.address,
    );
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
