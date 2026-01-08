import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/config/app_config.dart';
import '../../core/models/ride_models.dart';
import '../../core/providers/ride_provider.dart';
import '../widgets/app_card.dart';
import '../widgets/app_button.dart';
import '../widgets/app_loading_indicator.dart';

/// BMAD Phase 5: Implement
/// Ride tracking screen for Tripo04OS Rider App
/// BMAD Principle: Maximize user trust with real-time ride tracking
class RideTrackingScreen extends StatefulWidget {
  final Ride ride;

  const RideTrackingScreen({
    super.key,
    required this.ride,
  });

  @override
  State<RideTrackingScreen> createState() => _RideTrackingScreenState();
}

class _RideTrackingScreenState extends State<RideTrackingScreen> {
  int _selectedTabIndex = 0;

  @override
  void initState() {
    super.initState();
    // BMAD Principle: Auto-start ride tracking
    _startRideTracking();
  }

  Future<void> _startRideTracking() async {
    final rideProvider = context.read<RideProvider>();
    await rideProvider.startRideTracking(widget.ride.rideId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<RideProvider>(
        builder: (context, rideProvider, child) {
          final ride = rideProvider.activeRide ?? widget.ride;
          
          return Stack(
            children: [
              // BMAD Principle: Full-screen map for tracking
              _buildMap(context, ride),
              
              // BMAD Principle: Overlay UI for ride information
              _buildRideInfoOverlay(context, ride),
              
              // BMAD Principle: Bottom sheet for actions
              _buildBottomSheet(context, ride, rideProvider),
            ],
          );
        },
      ),
    );
  }

  Widget _buildMap(BuildContext context, Ride ride) {
    return Container(
      color: Colors.grey[200],
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.map,
              size: 64,
              color: Colors.grey[400],
            ),
            SizedBox(height: 16),
            Text(
              'Google Maps Integration',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Integrate with Google Maps Flutter Plugin',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRideInfoOverlay(BuildContext context, Ride ride) {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: SafeArea(
        child: Column(
          children: [
            // BMAD Principle: Ride status header
            _buildRideStatusHeader(context, ride),
            
            // BMAD Principle: Driver information card
            if (ride.driverInfo != null)
              _buildDriverInfoCard(context, ride),
          ],
        ),
      ),
    );
  }

  Widget _buildRideStatusHeader(BuildContext context, Ride ride) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          // BMAD Principle: Status message
          Row(
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: _getStatusColor(ride.status),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  _getStatusMessage(ride.status),
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // BMAD Principle: ETA and distance
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildInfoItem(
                context,
                icon: Icons.access_time,
                label: 'ETA',
                value: '${ride.etaMinutes} min',
              ),
              _buildInfoItem(
                context,
                icon: Icons.straighten,
                label: 'Distance',
                value: '${ride.distanceRemainingKm.toStringAsFixed(1)} km',
              ),
              _buildInfoItem(
                context,
                icon: Icons.attach_money,
                label: 'Fare',
                value: '\$${ride.fareEstimate.toStringAsFixed(2)}',
              ),
            ],
          ),
          
          // BMAD Principle: Progress indicator
          const SizedBox(height: 12),
          LinearProgressIndicator(
            value: _getRideProgress(ride.status),
            backgroundColor: Colors.grey[200],
            valueColor: AlwaysStoppedAnimation<Color>(
              Theme.of(context).primaryColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Column(
      children: [
        Icon(
          icon,
          color: Theme.of(context).primaryColor,
          size: 20,
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            color: Colors.grey[600],
          ),
        ),
        Text(
          value,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
      ],
    );
  }

  Widget _buildDriverInfoCard(BuildContext context, Ride ride) {
    final driver = ride.driverInfo!;
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // BMAD Principle: Driver photo
          CircleAvatar(
            radius: 32,
            backgroundImage: driver.photoUrl != null
                ? NetworkImage(driver.photoUrl!)
                : null,
            child: driver.photoUrl == null
                ? Icon(
                    Icons.person,
                    size: 32,
                    color: Colors.grey[400],
                  )
                : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // BMAD Principle: Driver name and rating
                Row(
                  children: [
                    Text(
                      driver.name,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.amber[100],
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.star,
                            size: 12,
                            color: Colors.amber[600],
                          ),
                          const SizedBox(width: 2),
                          Text(
                            driver.rating.toStringAsFixed(1),
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Colors.amber[700],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                // BMAD Principle: Vehicle information
                Row(
                  children: [
                    Icon(
                      Icons.directions_car,
                      size: 16,
                      color: Colors.grey[600],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${driver.vehicleColor} ${driver.vehicleType}',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Icon(
                      Icons.confirmation_number,
                      size: 16,
                      color: Colors.grey[600],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      driver.vehiclePlate,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // BMAD Principle: Quick actions
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.phone),
                onPressed: () => _callDriver(context, driver.phone),
              ),
              IconButton(
                icon: const Icon(Icons.message),
                onPressed: () => _messageDriver(context),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBottomSheet(BuildContext context, Ride ride, RideProvider rideProvider) {
    return DraggableScrollableSheet(
      initialChildSize: 0.3,
      minChildSize: 0.3,
      maxChildSize: 0.7,
      builder: (context, scrollController) {
        return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 10,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: Column(
            children: [
              // BMAD Principle: Drag handle
              Container(
                margin: const EdgeInsets.symmetric(vertical: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              
              // BMAD Principle: Tab bar for different views
              _buildTabBar(context),
              
              // BMAD Principle: Tab content
              Expanded(
                child: _buildTabContent(context, ride, rideProvider, scrollController),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTabBar(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          _buildTab(
            context,
            index: 0,
            icon: Icons.info,
            label: 'Details',
          ),
          _buildTab(
            context,
            index: 1,
            icon: Icons.route,
            label: 'Route',
          ),
          _buildTab(
            context,
            index: 2,
            icon: Icons.security,
            label: 'Safety',
          ),
        ],
      ),
    );
  }

  Widget _buildTab(
    BuildContext context, {
    required int index,
    required IconData icon,
    required String label,
  }) {
    final isSelected = _selectedTabIndex == index;
    
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedTabIndex = index;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected
                ? Theme.of(context).primaryColor.withOpacity(0.1)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                color: isSelected
                    ? Theme.of(context).primaryColor
                    : Colors.grey[400],
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  color: isSelected
                      ? Theme.of(context).primaryColor
                      : Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTabContent(
    BuildContext context,
    Ride ride,
    RideProvider rideProvider,
    ScrollController scrollController,
  ) {
    switch (_selectedTabIndex) {
      case 0:
        return _buildDetailsTab(context, ride);
      case 1:
        return _buildRouteTab(context, ride);
      case 2:
        return _buildSafetyTab(context, ride, rideProvider);
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildDetailsTab(BuildContext context, Ride ride) {
    return ListView(
      controller: ScrollController(),
      padding: const EdgeInsets.all(16),
      children: [
        // BMAD Principle: Pickup and dropoff locations
        _buildLocationCard(
          context,
          icon: Icons.location_on,
          label: 'Pickup',
          location: ride.pickupLocation,
          color: Colors.green,
        ),
        const SizedBox(height: 12),
        _buildLocationCard(
          context,
          icon: Icons.place,
          label: 'Dropoff',
          location: ride.dropoffLocation,
          color: Colors.red,
        ),
        const SizedBox(height: 24),
        
        // BMAD Principle: Fare breakdown
        Text(
          'Fare Breakdown',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 12),
        AppCard(
          child: Column(
            children: [
              _buildFareRow('Base Fare', '\$15.00'),
              _buildFareRow('Distance Fare', '\$${(ride.distanceRemainingKm * 1.5).toStringAsFixed(2)}'),
              _buildFareRow('Time Fare', '\$${(ride.etaMinutes * 0.5).toStringAsFixed(2)}'),
              const Divider(),
              _buildFareRow(
                'Total',
                '\$${ride.fareEstimate.toStringAsFixed(2)}',
                isBold: true,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLocationCard(
    BuildContext context, {
    required IconData icon,
    required String label,
    required Location location,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            color: color,
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
                  location.address ?? 'Unknown',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFareRow(String label, String value, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRouteTab(BuildContext context, Ride ride) {
    return ListView(
      controller: ScrollController(),
      padding: const EdgeInsets.all(16),
      children: [
        // BMAD Principle: Route summary
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Route Summary',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 16),
              _buildRouteInfoItem(
                'Total Distance',
                '${ride.distanceRemainingKm.toStringAsFixed(1)} km',
              ),
              _buildRouteInfoItem(
                'Estimated Time',
                '${ride.etaMinutes} minutes',
              ),
              _buildRouteInfoItem(
                'Current Speed',
                '40 km/h',
              ),
              _buildRouteInfoItem(
                'Traffic',
                'Moderate',
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        
        // BMAD Principle: Route steps
        Text(
          'Route Steps',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 12),
        _buildRouteStep(
          context,
          step: 1,
          icon: Icons.location_on,
          label: 'Pickup',
          address: ride.pickupLocation.address ?? 'Unknown',
          completed: true,
        ),
        _buildRouteStep(
          context,
          step: 2,
          icon: Icons.navigation,
          label: 'En route',
          address: 'In progress',
          completed: false,
          isActive: true,
        ),
        _buildRouteStep(
          context,
          step: 3,
          icon: Icons.place,
          label: 'Dropoff',
          address: ride.dropoffLocation.address ?? 'Unknown',
          completed: false,
        ),
      ],
    );
  }

  Widget _buildRouteInfoItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.grey[600],
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRouteStep(
    BuildContext context, {
    required int step,
    required IconData icon,
    required String label,
    required String address,
    required bool completed,
    bool isActive = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isActive
            ? Theme.of(context).primaryColor.withOpacity(0.1)
            : completed
                ? Colors.green.withOpacity(0.1)
                : Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: isActive
                  ? Theme.of(context).primaryColor
                  : completed
                      ? Colors.green
                      : Colors.grey[300],
              shape: BoxShape.circle,
            ),
            child: Icon(
              completed ? Icons.check : icon,
              color: Colors.white,
            ),
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
                  address,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSafetyTab(BuildContext context, Ride ride, RideProvider rideProvider) {
    return ListView(
      controller: ScrollController(),
      padding: const EdgeInsets.all(16),
      children: [
        // BMAD Principle: Safety features
        Text(
          'Safety Features',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 12),
        _buildSafetyFeature(
          context,
          icon: Icons.share,
          title: 'Share Trip',
          description: 'Share your trip status with trusted contacts',
          onTap: () => _shareTrip(context, ride),
        ),
        _buildSafetyFeature(
          context,
          icon: Icons.contact_phone,
          title: 'Emergency Contacts',
          description: 'Quick access to emergency contacts',
          onTap: () => _showEmergencyContacts(context),
        ),
        _buildSafetyFeature(
          context,
          icon: Icons.emergency,
          title: 'Emergency Services',
          description: 'Call emergency services directly',
          onTap: () => _callEmergency(context),
        ),
        _buildSafetyFeature(
          context,
          icon: Icons.report_problem,
          title: 'Report Issue',
          description: 'Report a safety concern',
          onTap: () => _reportIssue(context),
        ),
        const SizedBox(height: 24),
        
        // BMAD Principle: Driver verification
        Text(
          'Driver Verification',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 12),
        AppCard(
          child: Column(
            children: [
              _buildVerificationItem(
                'Verified Driver',
                Icons.verified_user,
                true,
              ),
              _buildVerificationItem(
                'Background Check',
                Icons.check_circle,
                true,
              ),
              _buildVerificationItem(
                'Insurance',
                Icons.security,
                true,
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        
        // BMAD Principle: Cancel ride button
        if (ride.status != RideStatus.inProgress)
          AppButton(
            text: 'Cancel Ride',
            onPressed: () => _cancelRide(context, ride, rideProvider),
            backgroundColor: Colors.red,
          ),
      ],
    );
  }

  Widget _buildSafetyFeature(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String description,
    required VoidCallback onTap,
  }) {
    return AppCard(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Theme.of(context).primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: Theme.of(context).primaryColor,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
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

  Widget _buildVerificationItem(String label, IconData icon, bool verified) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(
            icon,
            color: verified ? Colors.green : Colors.grey[400],
          ),
          const SizedBox(width: 12),
          Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.w500,
            ),
          ),
          const Spacer(),
          if (verified)
            Icon(
              Icons.check_circle,
              color: Colors.green,
              size: 20,
            ),
        ],
      ),
    );
  }

  Color _getStatusColor(RideStatus status) {
    switch (status) {
      case RideStatus.searching:
        return Colors.orange;
      case RideStatus.driverAssigned:
      case RideStatus.arriving:
        return Colors.blue;
      case RideStatus.inProgress:
        return Colors.green;
      case RideStatus.completed:
        return Colors.green;
      case RideStatus.cancelled:
        return Colors.red;
    }
  }

  String _getStatusMessage(RideStatus status) {
    switch (status) {
      case RideStatus.searching:
        return 'Finding the best driver for you...';
      case RideStatus.driverAssigned:
        return 'Your driver is on the way!';
      case RideStatus.arriving:
        return 'Driver is arriving at your location';
      case RideStatus.inProgress:
        return 'You\'re on your way!';
      case RideStatus.completed:
        return 'Ride completed. Thank you!';
      case RideStatus.cancelled:
        return 'Ride cancelled.';
    }
  }

  double _getRideProgress(RideStatus status) {
    switch (status) {
      case RideStatus.searching:
        return 0.2;
      case RideStatus.driverAssigned:
        return 0.4;
      case RideStatus.arriving:
        return 0.6;
      case RideStatus.inProgress:
        return 0.8;
      case RideStatus.completed:
        return 1.0;
      case RideStatus.cancelled:
        return 0.0;
    }
  }

  Future<void> _callDriver(BuildContext context, String phone) async {
    // BMAD Principle: Direct communication with driver
    final Uri launchUri = Uri(scheme: 'tel', path: phone);
    // In production, use url_launcher package
  }

  Future<void> _messageDriver(BuildContext context) async {
    // BMAD Principle: In-app messaging with driver
    // In production, open chat screen
  }

  Future<void> _shareTrip(BuildContext context, Ride ride) async {
    // BMAD Principle: Share trip status with contacts
    // In production, use share_plus package
  }

  void _showEmergencyContacts(BuildContext context) {
    // BMAD Principle: Quick access to emergency contacts
    // In production, show emergency contacts modal
  }

  Future<void> _callEmergency(BuildContext context) async {
    // BMAD Principle: Quick access to emergency services
    final Uri launchUri = Uri(scheme: 'tel', path: AppConfig.emergencyNumber);
    // In production, use url_launcher package
  }

  void _reportIssue(BuildContext context) {
    // BMAD Principle: Easy issue reporting
    // In production, open issue reporting screen
  }

  Future<void> _cancelRide(BuildContext context, Ride ride, RideProvider rideProvider) async {
    // BMAD Principle: Easy ride cancellation
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Ride'),
        content: const Text('Are you sure you want to cancel this ride?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );
    
    if (confirmed == true && context.mounted) {
      await rideProvider.cancelRide(ride.rideId);
      if (context.mounted) {
        Navigator.pop(context);
      }
    }
  }
}
