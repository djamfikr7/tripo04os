/// BMAD Phase 1: Diagnose
/// Ride models for Tripo04OS Rider App
/// BMAD Principle: Clear data models ensure type safety and business logic enforcement

import 'package:equatable/equatable.dart';

/// BMAD Phase 2: Ideate
/// Location model for geographic coordinates
/// BMAD Principle: Precise location data enables accurate ride matching
class Location extends Equatable {
  final double latitude;
  final double longitude;
  final String? address;
  final String? city;
  final String? country;
  final DateTime? timestamp;

  const Location({
    required this.latitude,
    required this.longitude,
    this.address,
    this.city,
    this.country,
    this.timestamp,
  });

  @override
  List<Object?> get props => [
        latitude,
        longitude,
        address,
        city,
        country,
        timestamp,
      ];

  Map<String, dynamic> toJson() {
    return {
      'latitude': latitude,
      'longitude': longitude,
      if (address != null) 'address': address,
      if (city != null) 'city': city,
      if (country != null) 'country': country,
      if (timestamp != null) 'timestamp': timestamp!.toIso8601String(),
    };
  }

  factory Location.fromJson(Map<String, dynamic> json) {
    return Location(
      latitude: json['latitude'] as double,
      longitude: json['longitude'] as double,
      address: json['address'] as String?,
      city: json['city'] as String?,
      country: json['country'] as String?,
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'] as String)
          : null,
    );
  }

  /// BMAD Phase 3: Prototype
  /// Calculate distance to another location
  /// BMAD Principle: Accurate distance calculation for fare estimation
  double distanceTo(Location other) {
    const double earthRadius = 6371; // km
    
    final double lat1Rad = latitude * (3.14159265359 / 180);
    final double lat2Rad = other.latitude * (3.14159265359 / 180);
    final double deltaLatRad = (other.latitude - latitude) * (3.14159265359 / 180);
    final double deltaLonRad = (other.longitude - longitude) * (3.14159265359 / 180);
    
    final double a = (deltaLatRad / 2).abs().sin() *
        (deltaLatRad / 2).abs().sin() +
        lat1Rad.cos() *
            lat2Rad.cos() *
            (deltaLonRad / 2).abs().sin() *
            (deltaLonRad / 2).abs().sin();
    
    final double c = 2 * a.sqrt().asin();
    
    return earthRadius * c;
  }

  Location copyWith({
    double? latitude,
    double? longitude,
    String? address,
    String? city,
    String? country,
    DateTime? timestamp,
  }) {
    return Location(
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      address: address ?? this.address,
      city: city ?? this.city,
      country: country ?? this.country,
      timestamp: timestamp ?? this.timestamp,
    );
  }
}

/// BMAD Phase 2: Ideate
/// Service type enum for multi-service platform
/// BMAD Principle: Clear service categorization enables targeted features
enum ServiceType {
  ride('RIDE', 'Ride', '🚗'),
  moto('MOTO', 'Moto', '🏍'),
  food('FOOD', 'Food Delivery', '🍔'),
  grocery('GROCERY', 'Grocery', '🛒'),
  goods('GOODS', 'Goods', '📦'),
  truckVan('TRUCK_VAN', 'Truck/Van', '🚚');

  final String value;
  final String displayName;
  final String emoji;

  const ServiceType(this.value, this.displayName, this.emoji);

  static ServiceType fromString(String value) {
    return ServiceType.values.firstWhere(
      (type) => type.value == value,
      orElse: () => ServiceType.ride,
    );
  }
}

/// BMAD Phase 2: Ideate
/// Vehicle type enum for ride service
/// BMAD Principle: Vehicle type options for user preference
enum VehicleType {
  sedan('SEDAN', 'Sedan', '🚗', 4),
  suv('SUV', 'SUV', '🚙', 6),
  luxurySedan('LUXURY_SEDAN', 'Luxury Sedan', '⭐', 4),
  luxurySuv('LUXURY_SUV', 'Luxury SUV', '🌟', 6),
  moto('MOTO', 'Moto', '🏍', 1),
  scooter('SCOOTER', 'Scooter', '🛴', 1);

  final String value;
  final String displayName;
  final String emoji;
  final int capacity;

  const VehicleType(this.value, this.displayName, this.emoji, this.capacity);

  static VehicleType fromString(String value) {
    return VehicleType.values.firstWhere(
      (type) => type.value == value,
      orElse: () => VehicleType.sedan,
    );
  }
}

/// BMAD Phase 2: Ideate
/// Ride status enum for ride lifecycle
/// BMAD Principle: Clear status tracking for user transparency
enum RideStatus {
  searching('SEARCHING', 'Finding driver'),
  driverAssigned('DRIVER_ASSIGNED', 'Driver assigned'),
  arriving('ARRIVING', 'Driver arriving'),
  inProgress('IN_PROGRESS', 'In progress'),
  completed('COMPLETED', 'Completed'),
  cancelled('CANCELLED', 'Cancelled');

  final String value;
  final String displayName;

  const RideStatus(this.value, this.displayName);

  static RideStatus fromString(String value) {
    return RideStatus.values.firstWhere(
      (status) => status.value == value,
      orElse: () => RideStatus.searching,
    );
  }

  bool get isActive => this != RideStatus.completed && this != RideStatus.cancelled;
}

/// BMAD Phase 2: Ideate
/// Driver information model
/// BMAD Principle: Complete driver info builds user trust
class DriverInfo extends Equatable {
  final String driverId;
  final String name;
  final String phone;
  final double rating;
  final int totalRides;
  final String? photoUrl;
  final String vehicleType;
  final String vehiclePlate;
  final String vehicleColor;

  const DriverInfo({
    required this.driverId,
    required this.name,
    required this.phone,
    required this.rating,
    required this.totalRides,
    this.photoUrl,
    required this.vehicleType,
    required this.vehiclePlate,
    required this.vehicleColor,
  });

  @override
  List<Object?> get props => [
        driverId,
        name,
        phone,
        rating,
        totalRides,
        photoUrl,
        vehicleType,
        vehiclePlate,
        vehicleColor,
      ];

  Map<String, dynamic> toJson() {
    return {
      'driver_id': driverId,
      'name': name,
      'phone': phone,
      'rating': rating,
      'total_rides': totalRides,
      if (photoUrl != null) 'photo_url': photoUrl,
      'vehicle_type': vehicleType,
      'vehicle_plate': vehiclePlate,
      'vehicle_color': vehicleColor,
    };
  }

  factory DriverInfo.fromJson(Map<String, dynamic> json) {
    return DriverInfo(
      driverId: json['driver_id'] as String,
      name: json['name'] as String,
      phone: json['phone'] as String,
      rating: (json['rating'] as num).toDouble(),
      totalRides: json['total_rides'] as int,
      photoUrl: json['photo_url'] as String?,
      vehicleType: json['vehicle_type'] as String,
      vehiclePlate: json['vehicle_plate'] as String,
      vehicleColor: json['vehicle_color'] as String,
    );
  }

  DriverInfo copyWith({
    String? driverId,
    String? name,
    String? phone,
    double? rating,
    int? totalRides,
    String? photoUrl,
    String? vehicleType,
    String? vehiclePlate,
    String? vehicleColor,
  }) {
    return DriverInfo(
      driverId: driverId ?? this.driverId,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      rating: rating ?? this.rating,
      totalRides: totalRides ?? this.totalRides,
      photoUrl: photoUrl ?? this.photoUrl,
      vehicleType: vehicleType ?? this.vehicleType,
      vehiclePlate: vehiclePlate ?? this.vehiclePlate,
      vehicleColor: vehicleColor ?? this.vehicleColor,
    );
  }
}

/// BMAD Phase 2: Ideate
/// Ride model for active rides
/// BMAD Principle: Complete ride data for real-time tracking
class Ride extends Equatable {
  final String rideId;
  final RideStatus status;
  final Location pickupLocation;
  final Location dropoffLocation;
  final Location? currentLocation;
  final DriverInfo? driverInfo;
  final ServiceType serviceType;
  final VehicleType vehicleType;
  final int etaMinutes;
  final double distanceRemainingKm;
  final double fareEstimate;
  final String currency;
  final DateTime? scheduledTime;
  final DateTime createdAt;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final DateTime? cancelledAt;
  final String? cancelReason;
  final List<String> specialRequests;

  const Ride({
    required this.rideId,
    required this.status,
    required this.pickupLocation,
    required this.dropoffLocation,
    this.currentLocation,
    this.driverInfo,
    required this.serviceType,
    required this.vehicleType,
    required this.etaMinutes,
    required this.distanceRemainingKm,
    required this.fareEstimate,
    this.currency = 'USD',
    this.scheduledTime,
    required this.createdAt,
    this.startedAt,
    this.completedAt,
    this.cancelledAt,
    this.cancelReason,
    this.specialRequests = const [],
  });

  @override
  List<Object?> get props => [
        rideId,
        status,
        pickupLocation,
        dropoffLocation,
        currentLocation,
        driverInfo,
        serviceType,
        vehicleType,
        etaMinutes,
        distanceRemainingKm,
        fareEstimate,
        currency,
        scheduledTime,
        createdAt,
        startedAt,
        completedAt,
        cancelledAt,
        cancelReason,
        specialRequests,
      ];

  Map<String, dynamic> toJson() {
    return {
      'ride_id': rideId,
      'status': status.value,
      'pickup_location': pickupLocation.toJson(),
      'dropoff_location': dropoffLocation.toJson(),
      if (currentLocation != null) 'current_location': currentLocation!.toJson(),
      if (driverInfo != null) 'driver_info': driverInfo!.toJson(),
      'service_type': serviceType.value,
      'vehicle_type': vehicleType.value,
      'eta_minutes': etaMinutes,
      'distance_remaining_km': distanceRemainingKm,
      'fare_estimate': fareEstimate,
      'currency': currency,
      if (scheduledTime != null) 'scheduled_time': scheduledTime!.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      if (startedAt != null) 'started_at': startedAt!.toIso8601String(),
      if (completedAt != null) 'completed_at': completedAt!.toIso8601String(),
      if (cancelledAt != null) 'cancelled_at': cancelledAt!.toIso8601String(),
      if (cancelReason != null) 'cancel_reason': cancelReason,
      'special_requests': specialRequests,
    };
  }

  factory Ride.fromJson(Map<String, dynamic> json) {
    return Ride(
      rideId: json['ride_id'] as String,
      status: RideStatus.fromString(json['status'] as String),
      pickupLocation: Location.fromJson(json['pickup_location'] as Map<String, dynamic>),
      dropoffLocation: Location.fromJson(json['dropoff_location'] as Map<String, dynamic>),
      currentLocation: json['current_location'] != null
          ? Location.fromJson(json['current_location'] as Map<String, dynamic>)
          : null,
      driverInfo: json['driver_info'] != null
          ? DriverInfo.fromJson(json['driver_info'] as Map<String, dynamic>)
          : null,
      serviceType: ServiceType.fromString(json['service_type'] as String),
      vehicleType: VehicleType.fromString(json['vehicle_type'] as String),
      etaMinutes: json['eta_minutes'] as int,
      distanceRemainingKm: (json['distance_remaining_km'] as num).toDouble(),
      fareEstimate: (json['fare_estimate'] as num).toDouble(),
      currency: json['currency'] as String? ?? 'USD',
      scheduledTime: json['scheduled_time'] != null
          ? DateTime.parse(json['scheduled_time'] as String)
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
      startedAt: json['started_at'] != null
          ? DateTime.parse(json['started_at'] as String)
          : null,
      completedAt: json['completed_at'] != null
          ? DateTime.parse(json['completed_at'] as String)
          : null,
      cancelledAt: json['cancelled_at'] != null
          ? DateTime.parse(json['cancelled_at'] as String)
          : null,
      cancelReason: json['cancel_reason'] as String?,
      specialRequests: (json['special_requests'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
    );
  }

  /// BMAD Phase 3: Prototype
  /// Check if ride is active
  /// BMAD Principle: Quick status checks for UI logic
  bool get isActive => status.isActive;

  /// BMAD Phase 3: Prototype
  /// Check if ride is completed
  bool get isCompleted => status == RideStatus.completed;

  /// BMAD Phase 3: Prototype
  /// Check if ride is cancelled
  bool get isCancelled => status == RideStatus.cancelled;

  /// BMAD Phase 3: Prototype
  /// Check if ride is scheduled
  bool get isScheduled => scheduledTime != null && scheduledTime!.isAfter(DateTime.now());

  /// BMAD Phase 3: Prototype
  /// Get ride duration in minutes
  int? get durationMinutes {
    if (startedAt == null || completedAt == null) return null;
    return completedAt!.difference(startedAt!).inMinutes;
  }

  /// BMAD Phase 3: Prototype
  /// Get total distance traveled
  double get totalDistanceKm {
    // In production, calculate from route points
    return pickupLocation.distanceTo(dropoffLocation);
  }

  Ride copyWith({
    String? rideId,
    RideStatus? status,
    Location? pickupLocation,
    Location? dropoffLocation,
    Location? currentLocation,
    DriverInfo? driverInfo,
    ServiceType? serviceType,
    VehicleType? vehicleType,
    int? etaMinutes,
    double? distanceRemainingKm,
    double? fareEstimate,
    String? currency,
    DateTime? scheduledTime,
    DateTime? createdAt,
    DateTime? startedAt,
    DateTime? completedAt,
    DateTime? cancelledAt,
    String? cancelReason,
    List<String>? specialRequests,
  }) {
    return Ride(
      rideId: rideId ?? this.rideId,
      status: status ?? this.status,
      pickupLocation: pickupLocation ?? this.pickupLocation,
      dropoffLocation: dropoffLocation ?? this.dropoffLocation,
      currentLocation: currentLocation ?? this.currentLocation,
      driverInfo: driverInfo ?? this.driverInfo,
      serviceType: serviceType ?? this.serviceType,
      vehicleType: vehicleType ?? this.vehicleType,
      etaMinutes: etaMinutes ?? this.etaMinutes,
      distanceRemainingKm: distanceRemainingKm ?? this.distanceRemainingKm,
      fareEstimate: fareEstimate ?? this.fareEstimate,
      currency: currency ?? this.currency,
      scheduledTime: scheduledTime ?? this.scheduledTime,
      createdAt: createdAt ?? this.createdAt,
      startedAt: startedAt ?? this.startedAt,
      completedAt: completedAt ?? this.completedAt,
      cancelledAt: cancelledAt ?? this.cancelledAt,
      cancelReason: cancelReason ?? this.cancelReason,
      specialRequests: specialRequests ?? this.specialRequests,
    );
  }
}

/// BMAD Phase 2: Ideate
/// Fare estimate model for pricing transparency
/// BMAD Principle: Clear fare breakdown builds user trust
class FareEstimate extends Equatable {
  final double baseFare;
  final double distanceFare;
  final double timeFare;
  final double totalFare;
  final String currency;
  final double distanceKm;
  final int estimatedTimeMinutes;
  final double? discount;
  final String? promoCode;

  const FareEstimate({
    required this.baseFare,
    required this.distanceFare,
    required this.timeFare,
    required this.totalFare,
    this.currency = 'USD',
    required this.distanceKm,
    required this.estimatedTimeMinutes,
    this.discount,
    this.promoCode,
  });

  @override
  List<Object?> get props => [
        baseFare,
        distanceFare,
        timeFare,
        totalFare,
        currency,
        distanceKm,
        estimatedTimeMinutes,
        discount,
        promoCode,
      ];

  Map<String, dynamic> toJson() {
    return {
      'base_fare': baseFare,
      'distance_fare': distanceFare,
      'time_fare': timeFare,
      'total_fare': totalFare,
      'currency': currency,
      'distance_km': distanceKm,
      'estimated_time_minutes': estimatedTimeMinutes,
      if (discount != null) 'discount': discount,
      if (promoCode != null) 'promo_code': promoCode,
    };
  }

  factory FareEstimate.fromJson(Map<String, dynamic> json) {
    return FareEstimate(
      baseFare: (json['base_fare'] as num).toDouble(),
      distanceFare: (json['distance_fare'] as num).toDouble(),
      timeFare: (json['time_fare'] as num).toDouble(),
      totalFare: (json['total_fare'] as num).toDouble(),
      currency: json['currency'] as String? ?? 'USD',
      distanceKm: (json['distance_km'] as num).toDouble(),
      estimatedTimeMinutes: json['estimated_time_minutes'] as int,
      discount: json['discount'] != null ? (json['discount'] as num).toDouble() : null,
      promoCode: json['promo_code'] as String?,
    );
  }

  /// BMAD Phase 3: Prototype
  /// Get fare per kilometer
  double get farePerKm => distanceKm > 0 ? totalFare / distanceKm : 0.0;

  /// BMAD Phase 3: Prototype
  /// Get fare per minute
  double get farePerMinute => estimatedTimeMinutes > 0 ? totalFare / estimatedTimeMinutes : 0.0;

  FareEstimate copyWith({
    double? baseFare,
    double? distanceFare,
    double? timeFare,
    double? totalFare,
    String? currency,
    double? distanceKm,
    int? estimatedTimeMinutes,
    double? discount,
    String? promoCode,
  }) {
    return FareEstimate(
      baseFare: baseFare ?? this.baseFare,
      distanceFare: distanceFare ?? this.distanceFare,
      timeFare: timeFare ?? this.timeFare,
      totalFare: totalFare ?? this.totalFare,
      currency: currency ?? this.currency,
      distanceKm: distanceKm ?? this.distanceKm,
      estimatedTimeMinutes: estimatedTimeMinutes ?? this.estimatedTimeMinutes,
      discount: discount ?? this.discount,
      promoCode: promoCode ?? this.promoCode,
    );
  }
}

/// BMAD Phase 2: Ideate
/// Route point model for ride tracking
/// BMAD Principle: Route points enable real-time tracking
class RoutePoint extends Equatable {
  final double latitude;
  final double longitude;
  final DateTime timestamp;
  final double? speedKmh;

  const RoutePoint({
    required this.latitude,
    required this.longitude,
    required this.timestamp,
    this.speedKmh,
  });

  @override
  List<Object?> get props => [latitude, longitude, timestamp, speedKmh];

  Map<String, dynamic> toJson() {
    return {
      'latitude': latitude,
      'longitude': longitude,
      'timestamp': timestamp.toIso8601String(),
      if (speedKmh != null) 'speed_kmh': speedKmh,
    };
  }

  factory RoutePoint.fromJson(Map<String, dynamic> json) {
    return RoutePoint(
      latitude: json['latitude'] as double,
      longitude: json['longitude'] as double,
      timestamp: DateTime.parse(json['timestamp'] as String),
      speedKmh: json['speed_kmh'] != null ? (json['speed_kmh'] as num).toDouble() : null,
    );
  }

  RoutePoint copyWith({
    double? latitude,
    double? longitude,
    DateTime? timestamp,
    double? speedKmh,
  }) {
    return RoutePoint(
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      timestamp: timestamp ?? this.timestamp,
      speedKmh: speedKmh ?? this.speedKmh,
    );
  }
}
