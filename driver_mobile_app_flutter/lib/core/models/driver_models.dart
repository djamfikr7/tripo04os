import 'dart:math';

import '../models/driver_models.dart';

/// BMAD Phase 5: Implement
/// Driver earnings model with all verticals
/// BMAD Principle: Clear earnings tracking increases driver satisfaction
class EarningsData {
  final double totalEarnings;
  final double todaysEarnings;
  final double weeklyEarnings;
  final double monthlyEarnings;
  final int totalTrips;
  final int todaysTrips;
  final int weeklyTrips;
  final int onlineHours;
  final double hourlyRate;
  final double perTripAverage;
  final List<ServiceEarnings> byService;
  final List<DailyEarnings> dailyBreakdown;
  final DateTime lastUpdated;

  EarningsData({
    required this.totalEarnings,
    required this.todaysEarnings,
    required this.weeklyEarnings,
    required this.monthlyEarnings,
    required this.totalTrips,
    required this.todaysTrips,
    required this.weeklyTrips,
    required this.onlineHours,
    required this.hourlyRate,
    required this.perTripAverage,
    required this.byService,
    required this.dailyBreakdown,
    required this.lastUpdated,
  });

  Map<String, dynamic> toJson() {
    return {
      'totalEarnings': totalEarnings,
      'todaysEarnings': todaysEarnings,
      'weeklyEarnings': weeklyEarnings,
      'monthlyEarnings': monthlyEarnings,
      'totalTrips': totalTrips,
      'todaysTrips': todaysTrips,
      'weeklyTrips': weeklyTrips,
      'onlineHours': onlineHours,
      'hourlyRate': hourlyRate,
      'perTripAverage': perTripAverage,
      'byService': byService.map((e) => e.toJson()).toList(),
      'dailyBreakdown': dailyBreakdown.map((e) => e.toJson()).toList(),
      'lastUpdated': lastUpdated.toIso8601String(),
    };
  }

  factory EarningsData.fromJson(Map<String, dynamic> json) {
    return EarningsData(
      totalEarnings: (json['totalEarnings'] ?? 0.0).toDouble(),
      todaysEarnings: (json['todaysEarnings'] ?? 0.0).toDouble(),
      weeklyEarnings: (json['weeklyEarnings'] ?? 0.0).toDouble(),
      monthlyEarnings: (json['monthlyEarnings'] ?? 0.0).toDouble(),
      totalTrips: json['totalTrips'] ?? 0,
      todaysTrips: json['todaysTrips'] ?? 0,
      weeklyTrips: json['weeklyTrips'] ?? 0,
      onlineHours: (json['onlineHours'] ?? 0.0).toDouble(),
      hourlyRate: (json['hourlyRate'] ?? 0.0).toDouble(),
      perTripAverage: (json['perTripAverage'] ?? 0.0).toDouble(),
      byService:
          (json['byService'] as List<dynamic>?)
              ?.map((e) => ServiceEarnings.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      dailyBreakdown:
          (json['dailyBreakdown'] as List<dynamic>?)
              ?.map((e) => DailyEarnings.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      lastUpdated: DateTime.parse(json['lastUpdated']),
    );
  }
}

/// BMAD Phase 5: Implement
/// Service-specific earnings
/// BMAD Principle: Multi-service revenue tracking
class ServiceEarnings {
  final ServiceType serviceType;
  final double earnings;
  final int trips;
  final double perTripAverage;

  ServiceEarnings({
    required this.serviceType,
    required this.earnings,
    required this.trips,
    required this.perTripAverage,
  });

  Map<String, dynamic> toJson() {
    return {
      'serviceType': serviceType.name,
      'earnings': earnings,
      'trips': trips,
      'perTripAverage': perTripAverage,
    };
  }

  factory ServiceEarnings.fromJson(Map<String, dynamic> json) {
    return ServiceEarnings(
      serviceType: ServiceType.values.firstWhere(
        (e) => e.name == json['serviceType'],
        orElse: () => ServiceType.ride,
      ),
      earnings: (json['earnings'] ?? 0.0).toDouble(),
      trips: json['trips'] ?? 0,
      perTripAverage: (json['perTripAverage'] ?? 0.0).toDouble(),
    );
  }
}

/// BMAD Phase 5: Implement
/// Daily earnings breakdown
/// BMAD Principle: Daily tracking helps drivers optimize
class DailyEarnings {
  final DateTime date;
  final double earnings;
  final int trips;
  final double hoursOnline;
  final double hourlyRate;

  DailyEarnings({
    required this.date,
    required this.earnings,
    required this.trips,
    required this.hoursOnline,
    required this.hourlyRate,
  });

  Map<String, dynamic> toJson() {
    return {
      'date': date.toIso8601String(),
      'earnings': earnings,
      'trips': trips,
      'hoursOnline': hoursOnline,
      'hourlyRate': hourlyRate,
    };
  }

  factory DailyEarnings.fromJson(Map<String, dynamic> json) {
    return DailyEarnings(
      date: DateTime.parse(json['date']),
      earnings: (json['earnings'] ?? 0.0).toDouble(),
      trips: json['trips'] ?? 0,
      hoursOnline: (json['hoursOnline'] ?? 0.0).toDouble(),
      hourlyRate: (json['hourlyRate'] ?? 0.0).toDouble(),
    );
  }
}

/// BMAD Phase 5: Implement
/// Driver model with multi-service support
/// BMAD Principle: Multi-service drivers maximize earnings
class DriverProfile {
  final String driverId;
  final String name;
  final String? profileImageUrl;
  final String phone;
  final String email;
  final double rating;
  final int totalRides;
  final int acceptanceRate;
  final double completionRate;
  final int totalEarnings;
  final List<ServiceType> availableServices;
  final List<VehicleType> availableVehicles;
  final bool isOnline;
  final String? currentStatus;
  final DateTime createdAt;
  final DateTime lastUpdated;

  DriverProfile({
    required this.driverId,
    required this.name,
    this.profileImageUrl,
    required this.phone,
    required this.email,
    required this.rating,
    required this.totalRides,
    required this.acceptanceRate,
    required this.completionRate,
    required this.totalEarnings,
    required this.availableServices,
    required this.availableVehicles,
    required this.isOnline,
    this.currentStatus,
    required this.createdAt,
    required this.lastUpdated,
  });

  Map<String, dynamic> toJson() {
    return {
      'driverId': driverId,
      'name': name,
      'profileImageUrl': profileImageUrl,
      'phone': phone,
      'email': email,
      'rating': rating,
      'totalRides': totalRides,
      'acceptanceRate': acceptanceRate,
      'completionRate': completionRate,
      'totalEarnings': totalEarnings,
      'availableServices': availableServices.map((e) => e.name).toList(),
      'availableVehicles': availableVehicles.map((e) => e.name).toList(),
      'isOnline': isOnline,
      'currentStatus': currentStatus,
      'createdAt': createdAt.toIso8601String(),
      'lastUpdated': lastUpdated.toIso8601String(),
    };
  }

  factory DriverProfile.fromJson(Map<String, dynamic> json) {
    return DriverProfile(
      driverId: json['driverId'] as String,
      name: json['name'] as String,
      profileImageUrl: json['profileImageUrl'] as String?,
      phone: json['phone'] as String,
      email: json['email'] as String,
      rating: (json['rating'] ?? 0.0).toDouble(),
      totalRides: json['totalRides'] ?? 0,
      acceptanceRate: json['acceptanceRate'] ?? 0,
      completionRate: (json['completionRate'] ?? 0.0).toDouble(),
      totalEarnings: json['totalEarnings'] ?? 0,
      availableServices:
          (json['availableServices'] as List<dynamic>?)
              ?.map(
                (e) => ServiceType.values.firstWhere(
                  (s) => s.name == e,
                  orElse: () => ServiceType.ride,
                ),
              )
              .toList() ??
          [ServiceType.ride],
      availableVehicles:
          (json['availableVehicles'] as List<dynamic>?)
              ?.map(
                (e) => VehicleType.values.firstWhere(
                  (v) => v.name == e,
                  orElse: () => VehicleType.sedan,
                ),
              )
              .toList() ??
          [VehicleType.sedan],
      isOnline: json['isOnline'] ?? false,
      currentStatus: json['currentStatus'] as String?,
      createdAt: DateTime.parse(json['createdAt']),
      lastUpdated: DateTime.parse(json['lastUpdated']),
    );
  }
}

/// BMAD Phase 5: Implement
/// Service types enum
/// BMAD Principle: Clear service categorization
enum ServiceType { ride, moto, food, grocery, goods, truckVan }

/// BMAD Phase 5: Implement
/// Vehicle types enum
/// BMAD Principle: Vehicle types match service requirements
enum VehicleType {
  motorbike,
  scooter,
  seden,
  suv,
  motorcycke,
  deliveryScooter,
  deliveryVan,
  deliveryTruck,
  truck,
}

/// BMAD Phase 5: Implement
/// Driver status enum
/// BMAD Principle: Clear status tracking
enum DriverStatus { offline, available, enRoute, onBreak, busy }

/// BMAD Phase 5: Implement
/// Driver preference model
/// BMAD Principle: Preferences automate driver decisions
class DriverPreferences {
  final String? homeLocation;
  final List<String> favoriteAreas;
  final bool receiveNotifications;
  final bool autoAccept;
  final List<ServiceType> enabledServices;
  final int preferredService;
  final List<VehicleType> availableVehicles;
  final bool isAvailable247;
  final TimeOfDay? workStart;
  final TimeOfDay? workEnd;
  final double minimumFare;
  final bool enableSurgePricing;

  DriverPreferences({
    this.homeLocation,
    required this.favoriteAreas,
    required this.receiveNotifications,
    required this.autoAccept,
    required this.enabledServices,
    required this.preferredService,
    required this.availableVehicles,
    required this.isAvailable247,
    this.workStart,
    this.workEnd,
    required this.minimumFare,
    required this.enableSurgePricing,
  });

  Map<String, dynamic> toJson() {
    return {
      'homeLocation': homeLocation,
      'favoriteAreas': favoriteAreas,
      'receiveNotifications': receiveNotifications,
      'autoAccept': autoAccept,
      'enabledServices': enabledServices.map((e) => e.name).toList(),
      'preferredService': preferredService,
      'availableVehicles': availableVehicles.map((e) => e.name).toList(),
      'isAvailable247': isAvailable247,
      'workStart': workStart?.format(),
      'workEnd': workEnd?.format(),
      'minimumFare': minimumFare,
      'enableSurgePricing': enableSurgePricing,
    };
  }

  factory DriverPreferences.fromJson(Map<String, dynamic> json) {
    return DriverPreferences(
      homeLocation: json['homeLocation'] as String?,
      favoriteAreas:
          (json['favoriteAreas'] as List<dynamic>?)?.cast<String>() ?? [],
      receiveNotifications: json['receiveNotifications'] ?? true,
      autoAccept: json['autoAccept'] ?? false,
      enabledServices:
          (json['enabledServices'] as List<dynamic>?)
              ?.map(
                (e) => ServiceType.values.firstWhere(
                  (s) => s.name == e,
                  orElse: () => ServiceType.ride,
                ),
              )
              .toList() ??
          [ServiceType.ride],
      preferredService: json['preferredService'] ?? 0,
      availableVehicles:
          (json['availableVehicles'] as List<dynamic>?)
              ?.map(
                (e) => VehicleType.values.firstWhere(
                  (v) => v.name == e,
                  orElse: () => VehicleType.sedan,
                ),
              )
              .toList() ??
          [VehicleType.sedan],
      isAvailable247: json['isAvailable247'] ?? false,
      workStart: json['workStart'] != null
          ? TimeOfDay(
              hour: int.parse(json['workStart'].split(':')[0]),
              minute: int.parse(json['workStart'].split(':')[1]),
            )
          : null,
      workEnd: json['workEnd'] != null
          ? TimeOfDay(
              hour: int.parse(json['workEnd'].split(':')[0]),
              minute: int.parse(json['workEnd'].split(':')[1]),
            )
          : null,
      minimumFare: (json['minimumFare'] ?? 0.0).toDouble(),
      enableSurgePricing: json['enableSurgePricing'] ?? true,
    );
  }
}

/// BMAD Phase 5: Implement
/// Driver trip request model
/// BMAD Principle: Clear trip request tracking
class DriverTripRequest {
  final String requestId;
  final String riderId;
  final String riderName;
  final String? riderPhoto;
  final ServiceType serviceType;
  final VehicleType vehicleType;
  final Location pickupLocation;
  final Location dropoffLocation;
  final double estimatedFare;
  final double estimatedDistance;
  final int estimatedDuration;
  final DateTime requestTime;
  final TripStatus status;

  DriverTripRequest({
    required this.requestId,
    required this.riderId,
    required this.riderName,
    this.riderPhoto,
    required this.serviceType,
    required this.vehicleType,
    required this.pickupLocation,
    required this.dropoffLocation,
    required this.estimatedFare,
    required this.estimatedDistance,
    required this.estimatedDuration,
    required this.requestTime,
    required this.status,
  });

  Map<String, dynamic> toJson() {
    return {
      'requestId': requestId,
      'riderId': riderId,
      'riderName': riderName,
      'riderPhoto': riderPhoto,
      'serviceType': serviceType.name,
      'vehicleType': vehicleType.name,
      'pickupLocation': pickupLocation.toJson(),
      'dropoffLocation': dropoffLocation.toJson(),
      'estimatedFare': estimatedFare,
      'estimatedDistance': estimatedDistance,
      'estimatedDuration': estimatedDuration,
      'requestTime': requestTime.toIso8601String(),
      'status': status.name,
    };
  }

  factory DriverTripRequest.fromJson(Map<String, dynamic> json) {
    return DriverTripRequest(
      requestId: json['requestId'] as String,
      riderId: json['riderId'] as String,
      riderName: json['riderName'] as String,
      riderPhoto: json['riderPhoto'] as String?,
      serviceType: ServiceType.values.firstWhere(
        (e) => e.name == json['serviceType'],
        orElse: () => ServiceType.ride,
      ),
      vehicleType: VehicleType.values.firstWhere(
        (e) => e.name == json['vehicleType'],
        orElse: () => VehicleType.sedan,
      ),
      pickupLocation: Location.fromJson(
        json['pickupLocation'] as Map<String, dynamic>,
      ),
      dropoffLocation: Location.fromJson(
        json['dropoffLocation'] as Map<String, dynamic>,
      ),
      estimatedFare: (json['estimatedFare'] ?? 0.0).toDouble(),
      estimatedDistance: (json['estimatedDistance'] ?? 0.0).toDouble(),
      estimatedDuration: json['estimatedDuration'] ?? 0,
      requestTime: DateTime.parse(json['requestTime']),
      status: TripStatus.values.firstWhere(
        (s) => s.name == json['status'],
        orElse: () => TripStatus.pending,
      ),
    );
  }
}

/// BMAD Phase 5: Implement
/// Location model for driver app
/// BMAD Principle: Accurate location tracking
class Location {
  final double latitude;
  final double longitude;
  final String? address;
  final String? city;
  final String? country;
  final DateTime? timestamp;

  Location({
    required this.latitude,
    required this.longitude,
    this.address,
    this.city,
    this.country,
    this.timestamp,
  });

  Map<String, dynamic> toJson() {
    return {
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      'city': city,
      'country': country,
      'timestamp': timestamp?.toIso8601String(),
    };
  }

  factory Location.fromJson(Map<String, dynamic> json) {
    return Location(
      latitude: (json['latitude'] ?? 0.0).toDouble(),
      longitude: (json['longitude'] ?? 0.0).toDouble(),
      address: json['address'] as String?,
      city: json['city'] as String?,
      country: json['country'] as String?,
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : null,
    );
  }

  double distanceTo(Location other) {
    const R = 6371.0;
    final dLat = (other.latitude - latitude) * pi / 180;
    final dLon = (other.longitude - longitude) * pi / 180;
    final a =
        sin(dLat) * sin(latitude * pi / 180) +
        cos(dLat) * cos(latitude * pi / 180) * cos(dLon);
    final c = 2 * asin(sqrt((1 - a * a) / 2));
    final d = sqrt(a * a + b * b);
    final r = R * c;
    return r;
  }
}
