import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/config/app_config.dart';
import '../../core/providers/ride_provider.dart';
import '../../core/providers/earnings_provider.dart';
import '../../core/providers/location_provider.dart';
import '../widgets/driver_app_card.dart';
import '../widgets/driver_app_button.dart';
import '../ride/ride_acceptance_screen.dart';
import '../earnings/earnings_screen.dart';
import '../profile/profile_screen.dart';

/// BMAD Phase 5: Implement
/// Home screen for Tripo04OS Driver App
/// BMAD Principle: Maximize driver earnings with intuitive home screen
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    // BMAD Principle: Auto-load data for seamless driver experience
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    final locationProvider = context.read<LocationProvider>();
    final rideProvider = context.read<RideProvider>();
    final earningsProvider = context.read<EarningsProvider>();
    
    // BMAD Principle: Get driver location for accurate ride matching
    await locationProvider.getCurrentLocation();
    
    // BMAD Principle: Check for active rides
    await rideProvider.checkActiveRide();
    
    // BMAD Principle: Load earnings data
    await earningsProvider.loadEarnings();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<RideProvider>(
        builder: (context, rideProvider, child) {
          // BMAD Principle: Show active ride if available
          if (rideProvider.activeRide != null &&
              rideProvider.activeRide!.isActive) {
            return _buildActiveRideScreen(context, rideProvider);
          }
          
          return _buildHomeContent(context, rideProvider);
        },
      ),
      bottomNavigationBar: DriverBottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
      ),
    );
  }

  Widget _buildActiveRideScreen(BuildContext context, RideProvider rideProvider) {
    final ride = rideProvider.activeRide!;
    
    return Column(
      children: [
        // BMAD Principle: Active ride header
        _buildActiveRideHeader(context, ride),
        
        // BMAD Principle: Active ride details
        Expanded(
          child: _buildActiveRideDetails(context, ride),
        ),
        
        // BMAD Principle: Active ride actions
        _buildActiveRideActions(context, ride),
      ],
    );
  }

  Widget _buildActiveRideHeader(BuildContext context, dynamic ride) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Theme.of(context).primaryColor,
            Theme.of(context).primaryColor.withOpacity(0.7),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        children: [
          Text(
            'Active Ride',
            style: const TextStyle(
              fontSize: 16,
              color: Colors.white70,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _getRideStatusText(ride.status),
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveRideDetails(BuildContext context, dynamic ride) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // BMAD Principle: Rider information
          DriverAppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Rider Information',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 16),
                _buildRiderInfoRow(context, 'Name', ride.riderName ?? 'Unknown'),
                _buildRiderInfoRow(context, 'Rating', '${ride.riderRating ?? 0.0} ⭐'),
                _buildRiderInfoRow(context, 'Phone', ride.riderPhone ?? 'Unknown'),
                const SizedBox(height: 16),
                _buildRiderInfoRow(context, 'Pickup', ride.pickupLocation?.address ?? 'Unknown'),
                _buildRiderInfoRow(context, 'Dropoff', ride.dropoffLocation?.address ?? 'Unknown'),
              ],
            ),
          ),
          const SizedBox(height: 16),
          
          // BMAD Principle: Ride progress
          DriverAppCard(
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'ETA',
                      style: TextStyle(
                        color: Colors.grey[600],
                      ),
                    ),
                    Text(
                      '${ride.etaMinutes ?? 0} min',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: _getRideProgress(ride.status),
                  backgroundColor: Colors.grey[200],
                  valueColor: AlwaysStoppedAnimation<Color>(
                    Theme.of(context).primaryColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRiderInfoRow(BuildContext context, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: TextStyle(
                color: Colors.grey[600],
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveRideActions(BuildContext context, dynamic ride) {
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
            Expanded(
              child: DriverAppButton(
                text: 'Call Rider',
                onPressed: () => _callRider(context, ride.riderPhone ?? ''),
                icon: Icons.phone,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: DriverAppButton(
                text: 'Navigate',
                onPressed: () => _startNavigation(context, ride),
                icon: Icons.navigation,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHomeContent(BuildContext context, RideProvider rideProvider) {
    return CustomScrollView(
      slivers: [
        // BMAD Principle: Driver status header
        SliverToBoxAdapter(
          child: _buildDriverStatusHeader(context, rideProvider),
        ),
        
        // BMAD Principle: Quick stats
        SliverToBoxAdapter(
          child: _buildQuickStats(context),
        ),
        
        // BMAD Principle: Today's earnings
        SliverToBoxAdapter(
          child: _buildTodaysEarnings(context),
        ),
        
        // BMAD Principle: Recent rides
        SliverToBoxAdapter(
          child: _buildRecentRides(context),
        ),
        
        // BMAD Principle: Bottom padding
        const SliverToBoxAdapter(
          child: SizedBox(height: 100),
        ),
      ],
    );
  }

  Widget _buildDriverStatusHeader(BuildContext context, RideProvider rideProvider) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // BMAD Principle: Driver greeting
          Row(
            children: [
              CircleAvatar(
                radius: 32,
                backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
                child: Icon(
                  Icons.person,
                  color: Theme.of(context).primaryColor,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Good ${_getGreeting()}!',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      'Ready to earn',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // BMAD Principle: Availability toggle
          _buildAvailabilityToggle(context, rideProvider),
        ],
      ),
    );
  }

  Widget _buildAvailabilityToggle(BuildContext context, RideProvider rideProvider) {
    return DriverAppCard(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(
                Icons.work,
                color: Theme.of(context).primaryColor,
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Go Online',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  Text(
                    'Start receiving ride requests',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ],
          ),
          Switch(
            value: rideProvider.isOnline,
            onChanged: (value) => _toggleAvailability(context, value),
            activeColor: Theme.of(context).primaryColor,
          ),
        ],
      ),
    );
  }

  Widget _buildQuickStats(BuildContext context) {
    return Consumer<EarningsProvider>(
      builder: (context, earningsProvider, child) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Today\'s Stats',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: DriverAppCard(
                      child: Column(
                        children: [
                          Icon(
                            Icons.directions_car,
                            color: Theme.of(context).primaryColor,
                            size: 32,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '${earningsProvider.todayRides}',
                            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          Text(
                            'Rides',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DriverAppCard(
                      child: Column(
                        children: [
                          Icon(
                            Icons.access_time,
                            color: Theme.of(context).primaryColor,
                            size: 32,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '${earningsProvider.todayHours}h',
                            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          Text(
                            'Hours',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTodaysEarnings(BuildContext context) {
    return Consumer<EarningsProvider>(
      builder: (context, earningsProvider, child) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Today\'s Earnings',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              DriverAppCard(
                child: Column(
                  children: [
                    Text(
                      '\$${earningsProvider.todayEarnings.toStringAsFixed(2)}',
                      style: Theme.of(context).textTheme.displaySmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).primaryColor,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Base Fare: \$${earningsProvider.todayBaseFare.toStringAsFixed(2)}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                        Text(
                          'Tips: \$${earningsProvider.todayTips.toStringAsFixed(2)}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildRecentRides(BuildContext context) {
    return Consumer<RideProvider>(
      builder: (context, rideProvider, child) {
        if (rideProvider.recentRides.isEmpty) {
          return const SizedBox.shrink();
        }
        
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Recent Rides',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  TextButton(
                    onPressed: () => _navigateToEarnings(context),
                    child: const Text('See All'),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ...rideProvider.recentRides.take(3).map((ride) {
                return _buildRecentRideCard(context, ride);
              }),
            ],
          ),
        );
      },
    );
  }

  Widget _buildRecentRideCard(BuildContext context, dynamic ride) {
    return DriverAppCard(
      onTap: () => _showRideDetails(context, ride),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: _getStatusColor(ride.status).withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              Icons.directions_car,
              color: _getStatusColor(ride.status),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  ride.pickupLocation?.address ?? 'Unknown',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  ride.dropoffLocation?.address ?? 'Unknown',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '\$${ride.fare?.toStringAsFixed(2) ?? '0.00'}',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).primaryColor,
                    ),
              ),
              Text(
                _formatTime(ride.completedAt),
                style: TextStyle(
                  fontSize: 10,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _getGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  String _getRideStatusText(String status) {
    switch (status) {
      case 'SEARCHING':
        return 'Searching for rider';
      case 'DRIVER_ASSIGNED':
        return 'Driver assigned';
      case 'ARRIVING':
        return 'Arriving at pickup';
      case 'IN_PROGRESS':
        return 'Ride in progress';
      case 'COMPLETED':
        return 'Ride completed';
      case 'CANCELLED':
        return 'Ride cancelled';
      default:
        return 'Unknown';
    }
  }

  double _getRideProgress(String status) {
    switch (status) {
      case 'SEARCHING':
        return 0.2;
      case 'DRIVER_ASSIGNED':
        return 0.4;
      case 'ARRIVING':
        return 0.6;
      case 'IN_PROGRESS':
        return 0.8;
      case 'COMPLETED':
        return 1.0;
      case 'CANCELLED':
        return 0.0;
      default:
        return 0.0;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'COMPLETED':
        return Colors.green;
      case 'CANCELLED':
        return Colors.red;
      default:
        return Colors.blue;
    }
  }

  String _formatTime(DateTime? dateTime) {
    if (dateTime == null) return 'N/A';
    return '${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  Future<void> _toggleAvailability(BuildContext context, bool value) async {
    final rideProvider = context.read<RideProvider>();
    await rideProvider.toggleAvailability(value);
    
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(value ? 'You\'re now online' : 'You\'re now offline'),
          backgroundColor: value ? Colors.green : Colors.orange,
        ),
      );
    }
  }

  Future<void> _callRider(BuildContext context, String phone) async {
    // BMAD Principle: Direct communication with rider
    final Uri launchUri = Uri(scheme: 'tel', path: phone);
    // In production, use url_launcher package
  }

  Future<void> _startNavigation(BuildContext context, dynamic ride) async {
    // BMAD Principle: Start navigation to rider
    // In production, use google_maps_flutter plugin
  }

  void _showRideDetails(BuildContext context, dynamic ride) {
    // BMAD Principle: Show detailed ride information
    showModalBottomSheet(
      context: context,
      builder: (context) => _buildRideDetailsSheet(context, ride),
    );
  }

  Widget _buildRideDetailsSheet(BuildContext context, dynamic ride) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Ride Details',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 16),
          _buildDetailRow('Pickup', ride.pickupLocation?.address ?? 'Unknown'),
          _buildDetailRow('Dropoff', ride.dropoffLocation?.address ?? 'Unknown'),
          _buildDetailRow('Fare', '\$${ride.fare?.toStringAsFixed(2) ?? '0.00'}'),
          _buildDetailRow('Distance', '${ride.distance?.toStringAsFixed(1) ?? '0.0'} km'),
          _buildDetailRow('Duration', '${ride.durationMinutes ?? 0} minutes'),
          _buildDetailRow('Rider Rating', '${ride.riderRating ?? 0.0} ⭐'),
          const SizedBox(height: 24),
          DriverAppButton(
            text: 'Close',
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
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
                color: Colors.grey[600],
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _navigateToEarnings(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const EarningsScreen(),
      ),
    );
  }
}
