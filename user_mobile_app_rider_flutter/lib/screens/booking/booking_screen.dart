import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/config/app_config.dart';
import '../../core/models/ride_models.dart';
import '../../core/providers/booking_provider.dart';
import '../../core/providers/location_provider.dart';
import '../widgets/app_card.dart';
import '../widgets/app_button.dart';
import '../widgets/app_loading_indicator.dart';
import '../widgets/app_error_display.dart';

/// BMAD Phase 5: Implement
/// Booking screen for Tripo04OS Rider App
/// BMAD Principle: Maximize conversion with streamlined booking flow
class BookingScreen extends StatefulWidget {
  final ServiceType? initialServiceType;
  final Location? initialDropoffLocation;

  const BookingScreen({
    super.key,
    this.initialServiceType,
    this.initialDropoffLocation,
  });

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  int _currentStep = 0;
  ServiceType? _selectedServiceType;
  VehicleType? _selectedVehicleType;
  Location? _pickupLocation;
  Location? _dropoffLocation;
  DateTime? _scheduledTime;
  List<String> _specialRequests = [];
  String? _promoCode;
  String? _selectedPaymentMethod;

  @override
  void initState() {
    super.initState();
    // BMAD Principle: Pre-fill selections for faster booking
    _selectedServiceType = widget.initialServiceType ?? ServiceType.ride;
    _dropoffLocation = widget.initialDropoffLocation;
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    final locationProvider = context.read<LocationProvider>();
    final bookingProvider = context.read<BookingProvider>();
    
    // BMAD Principle: Use current location as default pickup
    if (locationProvider.currentLocation != null) {
      setState(() {
        _pickupLocation = locationProvider.currentLocation;
      });
    }
    
    // BMAD Principle: Load payment methods
    await bookingProvider.loadPaymentMethods();
    
    // BMAD Principle: Load favorite locations
    await bookingProvider.loadFavoriteLocations();
    
    // BMAD Principle: Load recent locations
    await bookingProvider.loadRecentLocations();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Book a Ride'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Consumer<BookingProvider>(
        builder: (context, bookingProvider, child) {
          if (bookingProvider.isLoading) {
            return const AppLoadingIndicator(
              message: 'Loading...',
            );
          }
          
          if (bookingProvider.error != null) {
            return AppErrorDisplay(
              message: bookingProvider.error!,
              onRetry: _loadInitialData,
            );
          }
          
          return Column(
            children: [
              // BMAD Principle: Progress indicator for booking flow
              _buildProgressIndicator(),
              
              // BMAD Principle: Step content
              Expanded(
                child: _buildStepContent(context, bookingProvider),
              ),
              
              // BMAD Principle: Navigation buttons
              _buildNavigationButtons(context, bookingProvider),
            ],
          );
        },
      ),
    );
  }

  Widget _buildProgressIndicator() {
    final steps = [
      'Service',
      'Vehicle',
      'Locations',
      'Estimate',
      'Payment',
      'Confirm',
    ];
    
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: List.generate(steps.length, (index) {
          final isCompleted = index < _currentStep;
          final isCurrent = index == _currentStep;
          final isLast = index == steps.length - 1;
          
          return Expanded(
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: isCompleted || isCurrent
                              ? Theme.of(context).primaryColor
                              : Colors.grey[300],
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: isCompleted
                              ? const Icon(
                                  Icons.check,
                                  color: Colors.white,
                                  size: 18,
                                )
                              : Text(
                                  '${index + 1}',
                                  style: TextStyle(
                                    color: isCurrent
                                        ? Colors.white
                                        : Colors.grey[600],
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        steps[index],
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                          color: isCurrent
                              ? Theme.of(context).primaryColor
                              : Colors.grey[600],
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      height: 2,
                      margin: const EdgeInsets.symmetric(horizontal: 8),
                      color: isCompleted
                          ? Theme.of(context).primaryColor
                          : Colors.grey[300],
                    ),
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _buildStepContent(BuildContext context, BookingProvider bookingProvider) {
    switch (_currentStep) {
      case 0:
        return _buildServiceSelection(context);
      case 1:
        return _buildVehicleSelection(context);
      case 2:
        return _buildLocationSelection(context, bookingProvider);
      case 3:
        return _buildFareEstimate(context, bookingProvider);
      case 4:
        return _buildPaymentSelection(context, bookingProvider);
      case 5:
        return _buildConfirmation(context, bookingProvider);
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildServiceSelection(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'What do you need?',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 16),
          ...AppConfig.serviceTypes.map((serviceType) {
            final type = ServiceType.fromString(serviceType);
            return _buildServiceCard(context, type);
          }),
        ],
      ),
    );
  }

  Widget _buildServiceCard(BuildContext context, ServiceType serviceType) {
    final isSelected = _selectedServiceType == serviceType;
    
    return AppCard(
      margin: const EdgeInsets.only(bottom: 12),
      onTap: () {
        setState(() {
          _selectedServiceType = serviceType;
          _selectedVehicleType = null; // Reset vehicle type
        });
      },
      child: Container(
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected
                ? Theme.of(context).primaryColor
                : Colors.transparent,
            width: 2,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: isSelected
                    ? Theme.of(context).primaryColor.withOpacity(0.1)
                    : Colors.grey[100],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                serviceType.emoji,
                style: const TextStyle(fontSize: 28),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    serviceType.displayName,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  Text(
                    _getServiceDescription(serviceType),
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(
                Icons.check_circle,
                color: Theme.of(context).primaryColor,
              ),
          ],
        ),
      ),
    );
  }

  String _getServiceDescription(ServiceType serviceType) {
    switch (serviceType) {
      case ServiceType.ride:
        return 'Get a ride to your destination';
      case ServiceType.moto:
        return 'Fast motorcycle ride';
      case ServiceType.food:
        return 'Order food from your favorite restaurants';
      case ServiceType.grocery:
        return 'Get groceries delivered to your door';
      case ServiceType.goods:
        return 'Send packages and parcels';
      case ServiceType.truckVan:
        return 'Large item delivery or moving';
    }
  }

  Widget _buildVehicleSelection(BuildContext context) {
    final vehicleTypes = _getVehicleTypesForService(_selectedServiceType!);
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Choose your ${_selectedServiceType!.displayName.toLowerCase()}',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 16),
          ...vehicleTypes.map((vehicleType) {
            return _buildVehicleCard(context, vehicleType);
          }),
        ],
      ),
    );
  }

  Widget _buildVehicleCard(BuildContext context, VehicleType vehicleType) {
    final isSelected = _selectedVehicleType == vehicleType;
    
    return AppCard(
      margin: const EdgeInsets.only(bottom: 12),
      onTap: () {
        setState(() {
          _selectedVehicleType = vehicleType;
        });
      },
      child: Container(
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected
                ? Theme.of(context).primaryColor
                : Colors.transparent,
            width: 2,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: isSelected
                    ? Theme.of(context).primaryColor.withOpacity(0.1)
                    : Colors.grey[100],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                vehicleType.emoji,
                style: const TextStyle(fontSize: 28),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    vehicleType.displayName,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  Text(
                    '${vehicleType.capacity} passengers',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(
                Icons.check_circle,
                color: Theme.of(context).primaryColor,
              ),
          ],
        ),
      ),
    );
  }

  List<VehicleType> _getVehicleTypesForService(ServiceType serviceType) {
    switch (serviceType) {
      case ServiceType.ride:
        return [
          VehicleType.sedan,
          VehicleType.suv,
          VehicleType.luxurySedan,
          VehicleType.luxurySuv,
        ];
      case ServiceType.moto:
        return [
          VehicleType.moto,
          VehicleType.scooter,
        ];
      default:
        return [];
    }
  }

  Widget _buildLocationSelection(BuildContext context, BookingProvider bookingProvider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Where to?',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 16),
          _buildLocationInput(
            context,
            label: 'Pickup Location',
            icon: Icons.my_location,
            location: _pickupLocation,
            onTap: () => _selectLocation(context, true),
            onUseCurrent: () => _useCurrentLocation(context),
          ),
          const SizedBox(height: 16),
          _buildLocationInput(
            context,
            label: 'Dropoff Location',
            icon: Icons.place,
            location: _dropoffLocation,
            onTap: () => _selectLocation(context, false),
          ),
          const SizedBox(height: 24),
          if (bookingProvider.favoriteLocations.isNotEmpty) ...[
            Text(
              'Favorite Destinations',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 12),
            ...bookingProvider.favoriteLocations.take(3).map((location) {
              return _buildFavoriteLocationCard(context, location);
            }),
          ],
          const SizedBox(height: 24),
          if (bookingProvider.recentLocations.isNotEmpty) ...[
            Text(
              'Recent Locations',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 12),
            ...bookingProvider.recentLocations.take(3).map((location) {
              return _buildRecentLocationCard(context, location);
            }),
          ],
        ],
      ),
    );
  }

  Widget _buildLocationInput(
    BuildContext context, {
    required String label,
    required IconData icon,
    required Location? location,
    required VoidCallback onTap,
    VoidCallback? onUseCurrent,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: Theme.of(context).primaryColor,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                  Text(
                    location?.address ?? 'Select location',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                  ),
                ],
              ),
            ),
            if (onUseCurrent != null)
              TextButton(
                onPressed: onUseCurrent,
                child: const Text('Use Current'),
              ),
            Icon(
              Icons.chevron_right,
              color: Colors.grey[400],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFavoriteLocationCard(BuildContext context, Location location) {
    return AppCard(
      margin: const EdgeInsets.only(bottom: 8),
      onTap: () {
        setState(() {
          _dropoffLocation = location;
        });
      },
      child: Row(
        children: [
          Icon(
            Icons.star,
            color: Colors.amber[600],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              location.address ?? 'Unknown',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          ),
          Icon(
            Icons.chevron_right,
            color: Colors.grey[400],
          ),
        ],
      ),
    );
  }

  Widget _buildRecentLocationCard(BuildContext context, Location location) {
    return AppCard(
      margin: const EdgeInsets.only(bottom: 8),
      onTap: () {
        setState(() {
          _dropoffLocation = location;
        });
      },
      child: Row(
        children: [
          Icon(
            Icons.history,
            color: Theme.of(context).primaryColor,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              location.address ?? 'Unknown',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          ),
          Icon(
            Icons.chevron_right,
            color: Colors.grey[400],
          ),
        ],
      ),
    );
  }

  Widget _buildFareEstimate(BuildContext context, BookingProvider bookingProvider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Fare Estimate',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 16),
          if (bookingProvider.fareEstimate != null)
            AppCard(
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Estimated Fare',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      Text(
                        '\$${bookingProvider.fareEstimate!.totalFare.toStringAsFixed(2)}',
                        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).primaryColor,
                            ),
                      ),
                    ],
                  ),
                  const Divider(),
                  _buildFareBreakdownRow(
                    'Base Fare',
                    '\$${bookingProvider.fareEstimate!.baseFare.toStringAsFixed(2)}',
                  ),
                  _buildFareBreakdownRow(
                    'Distance (${bookingProvider.fareEstimate!.distanceKm.toStringAsFixed(1)} km)',
                    '\$${bookingProvider.fareEstimate!.distanceFare.toStringAsFixed(2)}',
                  ),
                  _buildFareBreakdownRow(
                    'Time (${bookingProvider.fareEstimate!.estimatedTimeMinutes} min)',
                    '\$${bookingProvider.fareEstimate!.timeFare.toStringAsFixed(2)}',
                  ),
                  if (bookingProvider.fareEstimate!.discount != null)
                    _buildFareBreakdownRow(
                      'Discount',
                      '-\$${bookingProvider.fareEstimate!.discount!.toStringAsFixed(2)}',
                      color: Colors.green,
                    ),
                  const Divider(),
                  _buildFareBreakdownRow(
                    'Total',
                    '\$${bookingProvider.fareEstimate!.totalFare.toStringAsFixed(2)}',
                    isBold: true,
                  ),
                ],
              ),
            ),
          const SizedBox(height: 24),
          Text(
            'Promo Code',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 8),
          TextField(
            decoration: InputDecoration(
              hintText: 'Enter promo code',
              suffixIcon: TextButton(
                onPressed: () => _applyPromoCode(context, bookingProvider),
                child: const Text('Apply'),
              ),
            ),
            onChanged: (value) {
              setState(() {
                _promoCode = value.isEmpty ? null : value;
              });
            },
          ),
        ],
      ),
    );
  }

  Widget _buildFareBreakdownRow(
    String label,
    String value, {
    bool isBold = false,
    Color? color,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              color: color,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentSelection(BuildContext context, BookingProvider bookingProvider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Payment Method',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 16),
          ...bookingProvider.paymentMethods.map((method) {
            return _buildPaymentMethodCard(context, method, bookingProvider);
          }),
          const SizedBox(height: 16),
          AppButton(
            text: 'Add New Payment Method',
            onPressed: () => _addPaymentMethod(context),
            backgroundColor: Colors.grey[200],
            textColor: Colors.black,
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentMethodCard(
    BuildContext context,
    dynamic paymentMethod,
    BookingProvider bookingProvider,
  ) {
    final isSelected = _selectedPaymentMethod == paymentMethod.id;
    
    return AppCard(
      margin: const EdgeInsets.only(bottom: 12),
      onTap: () {
        setState(() {
          _selectedPaymentMethod = paymentMethod.id;
        });
      },
      child: Container(
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected
                ? Theme.of(context).primaryColor
                : Colors.transparent,
            width: 2,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Icon(
              _getPaymentIcon(paymentMethod.type),
              color: Theme.of(context).primaryColor,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                paymentMethod.name ?? 'Payment Method',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
              ),
            ),
            if (paymentMethod.isDefault)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Theme.of(context).primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'Default',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).primaryColor,
                  ),
                ),
              ),
            const SizedBox(width: 8),
            if (isSelected)
              Icon(
                Icons.check_circle,
                color: Theme.of(context).primaryColor,
              ),
          ],
        ),
      ),
    );
  }

  IconData _getPaymentIcon(String type) {
    switch (type.toLowerCase()) {
      case 'credit_card':
      case 'debit_card':
        return Icons.credit_card;
      case 'paypal':
        return Icons.payment;
      case 'apple_pay':
        return Icons.apple;
      case 'google_pay':
        return Icons.g_mobiledata;
      case 'cash':
        return Icons.money;
      default:
        return Icons.credit_card;
    }
  }

  Widget _buildConfirmation(BuildContext context, BookingProvider bookingProvider) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Review Your Booking',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 16),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildConfirmationRow(
                  'Service',
                  _selectedServiceType!.displayName,
                ),
                _buildConfirmationRow(
                  'Vehicle',
                  _selectedVehicleType!.displayName,
                ),
                _buildConfirmationRow(
                  'Pickup',
                  _pickupLocation?.address ?? 'Unknown',
                ),
                _buildConfirmationRow(
                  'Dropoff',
                  _dropoffLocation?.address ?? 'Unknown',
                ),
                if (_scheduledTime != null)
                  _buildConfirmationRow(
                    'Scheduled Time',
                    _formatDateTime(_scheduledTime!),
                  ),
                const Divider(),
                _buildConfirmationRow(
                  'Estimated Fare',
                  '\$${bookingProvider.fareEstimate?.totalFare.toStringAsFixed(2) ?? '0.00'}',
                  isBold: true,
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Terms and Conditions',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'By confirming this booking, you agree to our Terms of Service and Privacy Policy. Free cancellation is available within 5 minutes of booking.',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConfirmationRow(
    String label,
    String value, {
    bool isBold = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: TextStyle(
                fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
                color: Colors.grey[600],
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavigationButtons(BuildContext context, BookingProvider bookingProvider) {
    final isFirstStep = _currentStep == 0;
    final isLastStep = _currentStep == 5;
    final canProceed = _canProceedToNextStep();
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            if (!isFirstStep)
              Expanded(
                child: AppButton(
                  text: 'Back',
                  onPressed: () {
                    setState(() {
                      _currentStep--;
                    });
                  },
                  backgroundColor: Colors.grey[200],
                  textColor: Colors.black,
                ),
              ),
            if (!isFirstStep) const SizedBox(width: 12),
            Expanded(
              child: AppButton(
                text: isLastStep ? 'Confirm Booking' : 'Next',
                onPressed: canProceed
                    ? () => _handleNextStep(context, bookingProvider)
                    : null,
                isDisabled: !canProceed,
              ),
            ),
          ],
        ),
      ),
    );
  }

  bool _canProceedToNextStep() {
    switch (_currentStep) {
      case 0:
        return _selectedServiceType != null;
      case 1:
        return _selectedVehicleType != null;
      case 2:
        return _pickupLocation != null && _dropoffLocation != null;
      case 3:
        return true;
      case 4:
        return _selectedPaymentMethod != null;
      case 5:
        return true;
      default:
        return false;
    }
  }

  Future<void> _handleNextStep(BuildContext context, BookingProvider bookingProvider) async {
    if (_currentStep < 5) {
      // Load fare estimate when moving to step 3
      if (_currentStep == 2) {
        await bookingProvider.getFareEstimate(
          pickupLocation: _pickupLocation!,
          dropoffLocation: _dropoffLocation!,
          serviceType: _selectedServiceType!,
          vehicleType: _selectedVehicleType!,
          promoCode: _promoCode,
        );
      }
      
      setState(() {
        _currentStep++;
      });
    } else {
      // Confirm booking
      await _confirmBooking(context, bookingProvider);
    }
  }

  Future<void> _confirmBooking(BuildContext context, BookingProvider bookingProvider) async {
    final success = await bookingProvider.createBooking(
      pickupLocation: _pickupLocation!,
      dropoffLocation: _dropoffLocation!,
      serviceType: _selectedServiceType!,
      vehicleType: _selectedVehicleType!,
      scheduledTime: _scheduledTime,
      specialRequests: _specialRequests,
      promoCode: _promoCode,
      paymentMethodId: _selectedPaymentMethod,
    );
    
    if (success && mounted) {
      Navigator.pop(context, true);
    }
  }

  Future<void> _selectLocation(BuildContext context, bool isPickup) async {
    // BMAD Principle: Use location picker for precise selection
    // In production, integrate with Google Places API
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const LocationPickerScreen(),
      ),
    );
    
    if (result != null && mounted) {
      setState(() {
        if (isPickup) {
          _pickupLocation = result;
        } else {
          _dropoffLocation = result;
        }
      });
    }
  }

  Future<void> _useCurrentLocation(BuildContext context) async {
    final locationProvider = context.read<LocationProvider>();
    await locationProvider.getCurrentLocation();
    
    if (locationProvider.currentLocation != null && mounted) {
      setState(() {
        _pickupLocation = locationProvider.currentLocation;
      });
    }
  }

  Future<void> _applyPromoCode(BuildContext context, BookingProvider bookingProvider) async {
    if (_promoCode == null || _promoCode!.isEmpty) return;
    
    await bookingProvider.applyPromoCode(_promoCode!);
  }

  Future<void> _addPaymentMethod(BuildContext context) async {
    // BMAD Principle: Easy payment method addition
    // In production, integrate with payment gateway
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const AddPaymentMethodScreen(),
      ),
    );
  }

  String _formatDateTime(DateTime dateTime) {
    return '${dateTime.day}/${dateTime.month}/${dateTime.year} at ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
  }
}

/// BMAD Phase 5: Implement
/// Location picker screen for selecting pickup/dropoff locations
/// BMAD Principle: Intuitive location selection improves booking experience
class LocationPickerScreen extends StatelessWidget {
  const LocationPickerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Location'),
      ),
      body: const Center(
        child: Text('Location picker - Integrate with Google Places API'),
      ),
    );
  }
}

/// BMAD Phase 5: Implement
/// Add payment method screen
/// BMAD Principle: Easy payment method setup increases conversion
class AddPaymentMethodScreen extends StatelessWidget {
  const AddPaymentMethodScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Payment Method'),
      ),
      body: const Center(
        child: Text('Add payment method - Integrate with payment gateway'),
      ),
    );
  }
}
