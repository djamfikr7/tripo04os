/// BMAD Phase 1: Diagnose
/// Application configuration for Tripo04OS Rider App
/// BMAD Principle: Centralized configuration for maintainability and scalability

class AppConfig {
  // BMAD Principle: Clear API endpoint management for easy scaling
  static const String apiBaseUrl = 'https://api.tripo04os.com/v1';
  static const String wsBaseUrl = 'wss://api.tripo04os.com/ws';
  
  // BMAD Principle: Service-specific endpoints for modular architecture
  static const String authService = '/auth';
  static const String userService = '/users';
  static const String driverService = '/drivers';
  static const String orderService = '/orders';
  static const String paymentService = '/payments';
  static const String notificationService = '/notifications';
  static const String locationService = '/locations';
  static const String pricingService = '/pricing';
  static const String aiSupportService = '/ai-support';
  static const String premiumMatchingService = '/premium-matching';
  static const String profitOptimizationService = '/profit-optimization';
  
  // BMAD Principle: Service types for multi-service platform
  static const List<String> serviceTypes = [
    'RIDE',
    'MOTO',
    'FOOD',
    'GROCERY',
    'GOODS',
    'TRUCK_VAN',
  ];
  
  // BMAD Principle: Vehicle types for ride service
  static const List<String> rideVehicleTypes = [
    'SEDAN',
    'SUV',
    'LUXURY_SEDAN',
    'LUXURY_SUV',
  ];
  
  // BMAD Principle: Vehicle types for moto service
  static const List<String> motoVehicleTypes = [
    'MOTO',
    'SCOOTER',
  ];
  
  // BMAD Principle: Ride status states for clear state management
  static const List<String> rideStatuses = [
    'SEARCHING',
    'DRIVER_ASSIGNED',
    'ARRIVING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
  ];
  
  // BMAD Principle: Order status states for order tracking
  static const List<String> orderStatuses = [
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'READY',
    'PICKED_UP',
    'IN_TRANSIT',
    'DELIVERED',
    'CANCELLED',
  ];
  
  // BMAD Principle: Payment methods for user convenience
  static const List<String> paymentMethods = [
    'CREDIT_CARD',
    'DEBIT_CARD',
    'PAYPAL',
    'APPLE_PAY',
    'GOOGLE_PAY',
    'CASH',
  ];
  
  // BMAD Principle: App configuration for optimal user experience
  static const String appName = 'Tripo04OS Rider';
  static const String appVersion = '1.0.0';
  static const String packageName = 'com.tripo04os.rider';
  
  // BMAD Principle: Timeouts for responsive user experience
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 30);
  
  // BMAD Principle: Pagination for efficient data loading
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
  
  // BMAD Principle: Location update intervals for battery optimization
  static const Duration locationUpdateInterval = Duration(seconds: 10);
  static const Duration locationUpdateFastestInterval = Duration(seconds: 5);
  
  // BMAD Principle: Cache durations for optimal performance
  static const Duration shortCacheDuration = Duration(minutes: 5);
  static const Duration mediumCacheDuration = Duration(hours: 1);
  static const Duration longCacheDuration = Duration(days: 7);
  
  // BMAD Principle: Rating system for quality control
  static const int minRating = 1;
  static const int maxRating = 5;
  
  // BMAD Principle: Distance units for user clarity
  static const String distanceUnit = 'km';
  static const String currency = 'USD';
  
  // BMAD Principle: Support contact information
  static const String supportPhone = '+1 800 123 4567';
  static const String supportEmail = 'support@tripo04os.com';
  static const String supportUrl = 'https://tripo04os.com/support';
  
  // BMAD Principle: Social media links for user engagement
  static const Map<String, String> socialMedia = {
    'facebook': 'https://facebook.com/tripo04os',
    'twitter': 'https://twitter.com/tripo04os',
    'instagram': 'https://instagram.com/tripo04os',
    'linkedin': 'https://linkedin.com/company/tripo04os',
  };
  
  // BMAD Principle: Privacy policy and terms for legal compliance
  static const String privacyPolicyUrl = 'https://tripo04os.com/privacy';
  static const String termsOfServiceUrl = 'https://tripo04os.com/terms';
  
  // BMAD Principle: App store URLs for easy updates
  static const String appStoreUrl = 'https://apps.apple.com/app/tripo04os-rider';
  static const String playStoreUrl = 'https://play.google.com/store/apps/details?id=com.tripo04os.rider';
  
  // BMAD Principle: Feature flags for gradual rollout
  static const bool enableAIChat = true;
  static const bool enablePremiumMatching = true;
  static const bool enableProfitOptimization = true;
  static const bool enableScheduledRides = true;
  static const bool enableMultiStop = false;
  static const bool enableSplitPayment = false;
  
  // BMAD Principle: Analytics tracking for business insights
  static const bool enableAnalytics = true;
  static const bool enableCrashReporting = true;
  
  // BMAD Principle: Development environment configuration
  static const bool isDevelopment = false;
  static const bool enableDebugMode = false;
  static const bool enableLogging = true;
  
  // BMAD Principle: Security configuration
  static const bool enableBiometricAuth = true;
  static const int maxLoginAttempts = 5;
  static const Duration lockoutDuration = Duration(minutes: 15);
  
  // BMAD Principle: Notification configuration
  static const bool enablePushNotifications = true;
  static const bool enableEmailNotifications = true;
  static const bool enableSMSNotifications = false;
  
  // BMAD Principle: Refund policy configuration
  static const Duration freeCancellationWindow = Duration(minutes: 5);
  static const int refundProcessingDays = 5;
  
  // BMAD Principle: Tip configuration
  static const List<double> tipPercentages = [0.10, 0.15, 0.20];
  static const double defaultTipPercentage = 0.15;
  static const double maxTipAmount = 100.0;
  
  // BMAD Principle: Promo code configuration
  static const int maxPromoCodeLength = 20;
  static const int minPromoCodeLength = 4;
  
  // BMAD Principle: Emergency contact configuration
  static const String emergencyNumber = '911';
  static const int maxEmergencyContacts = 5;
  
  // BMAD Principle: Favorite locations configuration
  static const int maxFavoriteLocations = 10;
  
  // BMAD Principle: Recent locations configuration
  static const int maxRecentLocations = 20;
  
  // BMAD Principle: Review configuration
  static const Duration reviewPromptDelay = Duration(days: 7);
  static const int minRidesBeforeReview = 3;
  
  // BMAD Principle: Referral program configuration
  static const double referralBonus = 10.0;
  static const int maxReferralBonus = 100.0;
  
  // BMAD Principle: Loyalty program configuration
  static const int pointsPerDollar = 10;
  static const int redemptionRate = 100; // 100 points = $1
}
