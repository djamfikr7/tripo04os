import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/config/app_config.dart';
import '../../core/models/ride_models.dart';
import '../../core/providers/booking_provider.dart';
import '../../core/providers/ride_provider.dart';
import '../../core/providers/location_provider.dart';
import '../widgets/app_card.dart';
import '../widgets/app_button.dart';
import '../booking/booking_screen.dart';
import '../tracking/ride_tracking_screen.dart';
import '../history/ride_history_screen.dart';
import '../profile/profile_screen.dart';

/// BMAD Phase 5: Implement
/// Home screen for Tripo04OS Rider App
/// BMAD Principle: Maximize user engagement with intuitive home screen design
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    // BMAD Principle: Auto-load data for seamless user experience
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    final locationProvider = context.read<LocationProvider>();
    final rideProvider = context.read<RideProvider>();
    
    // BMAD Principle: Get user location for personalized experience
    await locationProvider.getCurrentLocation();
    
    // BMAD Principle: Check for active rides
    await rideProvider.checkActiveRide();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Consumer<RideProvider>(
          builder: (context, rideProvider, child) {
            // BMAD Principle: Show active ride if available
            if (rideProvider.activeRide != null &&
                rideProvider.activeRide!.isActive) {
              return RideTrackingScreen(
                ride: rideProvider.activeRide!,
              );
            }
            
            return _buildHomeContent(context);
          },
        ),
      ),
    );
  }

  Widget _buildHomeContent(BuildContext context) {
    return CustomScrollView(
      slivers: [
        // BMAD Principle: App bar with user greeting
        SliverToBoxAdapter(
          child: _buildAppBar(context),
        ),
        
        // BMAD Principle: Quick actions for immediate value
        SliverToBoxAdapter(
          child: _buildQuickActions(context),
        ),
        
        // BMAD Principle: Recent locations for convenience
        SliverToBoxAdapter(
          child: _buildRecentLocations(context),
        ),
        
        // BMAD Principle: Promotions for user engagement
        SliverToBoxAdapter(
          child: _buildPromotions(context),
        ),
        
        // BMAD Principle: Upcoming scheduled rides
        SliverToBoxAdapter(
          child: _buildScheduledRides(context),
        ),
        
        // BMAD Principle: Bottom padding
        const SliverToBoxAdapter(
          child: SizedBox(height: 100),
        ),
      ],
    );
  }

  Widget _buildAppBar(BuildContext context) {
    final locationProvider = context.watch<LocationProvider>();
    
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // BMAD Principle: Personalized greeting
          Row(
            children: [
              CircleAvatar(
                radius: 24,
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
                    const SizedBox(height: 4),
                    if (locationProvider.currentLocation != null)
                      Row(
                        children: [
                          Icon(
                            Icons.location_on,
                            size: 16,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              locationProvider.currentLocation!.address ??
                                  'Current Location',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey[600],
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
              // BMAD Principle: Quick access to notifications
              IconButton(
                icon: const Icon(Icons.notifications_outlined),
                onPressed: () {
                  // Navigate to notifications
                },
              ),
            ],
          ),
          const SizedBox(height: 16),
          // BMAD Principle: Main booking action
          Text(
            'Where to?',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GridView.count(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.3,
        children: [
          _buildQuickActionCard(
            context,
            icon: Icons.directions_car,
            title: 'Book a Ride',
            subtitle: 'Get a ride now',
            onTap: () => _navigateToBooking(context, ServiceType.ride),
            color: Theme.of(context).primaryColor,
          ),
          _buildQuickActionCard(
            context,
            icon: Icons.motorcycle,
            title: 'Moto',
            subtitle: 'Fast motorcycle',
            onTap: () => _navigateToBooking(context, ServiceType.moto),
            color: const Color(0xFFFF6B35),
          ),
          _buildQuickActionCard(
            context,
            icon: Icons.restaurant,
            title: 'Food',
            subtitle: 'Order food',
            onTap: () => _navigateToBooking(context, ServiceType.food),
            color: const Color(0xFFFF9800),
          ),
          _buildQuickActionCard(
            context,
            icon: Icons.shopping_cart,
            title: 'Grocery',
            subtitle: 'Grocery delivery',
            onTap: () => _navigateToBooking(context, ServiceType.grocery),
            color: const Color(0xFF4CAF50),
          ),
          _buildQuickActionCard(
            context,
            icon: Icons.local_shipping,
            title: 'Goods',
            subtitle: 'Package delivery',
            onTap: () => _navigateToBooking(context, ServiceType.goods),
            color: const Color(0xFF9C27B0),
          ),
          _buildQuickActionCard(
            context,
            icon: Icons.local_taxi,
            title: 'Truck/Van',
            subtitle: 'Large delivery',
            onTap: () => _navigateToBooking(context, ServiceType.truckVan),
            color: const Color(0xFF00BCD4),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    required Color color,
  }) {
    return AppCard(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: color,
              size: 24,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
            textAlign: TextAlign.center,
          ),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildRecentLocations(BuildContext context) {
    final bookingProvider = context.watch<BookingProvider>();
    
    if (bookingProvider.recentLocations.isEmpty) {
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
                'Recent Locations',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              TextButton(
                onPressed: () => _navigateToHistory(context),
                child: const Text('See All'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 120,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: bookingProvider.recentLocations.take(5).length,
              itemBuilder: (context, index) {
                final location = bookingProvider.recentLocations[index];
                return _buildRecentLocationCard(context, location);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentLocationCard(BuildContext context, Location location) {
    return Container(
      width: 200,
      margin: const EdgeInsets.only(right: 12),
      child: AppCard(
        onTap: () => _navigateToBookingWithLocation(context, location),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              Icons.history,
              color: Theme.of(context).primaryColor,
            ),
            const SizedBox(height: 8),
            Text(
              location.address ?? 'Unknown Location',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            if (location.city != null) ...[
              const SizedBox(height: 4),
              Text(
                location.city!,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildPromotions(BuildContext context) {
    final bookingProvider = context.watch<BookingProvider>();
    
    if (bookingProvider.promotions.isEmpty) {
      return const SizedBox.shrink();
    }
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Special Offers',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 140,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: bookingProvider.promotions.take(3).length,
              itemBuilder: (context, index) {
                final promotion = bookingProvider.promotions[index];
                return _buildPromotionCard(context, promotion);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPromotionCard(BuildContext context, dynamic promotion) {
    return Container(
      width: 280,
      margin: const EdgeInsets.only(right: 12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Theme.of(context).primaryColor,
            Theme.of(context).primaryColor.withOpacity(0.7),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.card_giftcard,
                color: Colors.white,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  promotion.title ?? 'Special Offer',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            promotion.description ?? 'Get a discount on your next ride',
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 12,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const Spacer(),
          if (promotion.discountPercentage != null)
            Text(
              '${promotion.discountPercentage}% OFF',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildScheduledRides(BuildContext context) {
    final bookingProvider = context.watch<BookingProvider>();
    
    if (bookingProvider.scheduledRides.isEmpty) {
      return const SizedBox.shrink();
    }
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Upcoming Rides',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 12),
          ...bookingProvider.scheduledRides.take(2).map((ride) {
            return _buildScheduledRideCard(context, ride);
          }),
        ],
      ),
    );
  }

  Widget _buildScheduledRideCard(BuildContext context, Ride ride) {
    return AppCard(
      margin: const EdgeInsets.only(bottom: 12),
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
              Icons.schedule,
              color: Theme.of(context).primaryColor,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  ride.scheduledTime != null
                      ? _formatDateTime(ride.scheduledTime!)
                      : 'Scheduled',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  ride.dropoffLocation.address ?? 'Destination',
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
          Icon(
            Icons.chevron_right,
            color: Colors.grey[400],
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

  String _formatDateTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = dateTime.difference(now);
    
    if (difference.inDays == 0) {
      return 'Today at ${_formatTime(dateTime)}';
    } else if (difference.inDays == 1) {
      return 'Tomorrow at ${_formatTime(dateTime)}';
    } else {
      return '${_formatDate(dateTime)} at ${_formatTime(dateTime)}';
    }
  }

  String _formatDate(DateTime dateTime) {
    return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
  }

  String _formatTime(DateTime dateTime) {
    return '${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  void _navigateToBooking(BuildContext context, ServiceType serviceType) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => BookingScreen(
          initialServiceType: serviceType,
        ),
      ),
    );
  }

  void _navigateToBookingWithLocation(BuildContext context, Location location) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => BookingScreen(
          initialDropoffLocation: location,
        ),
      ),
    );
  }

  void _navigateToHistory(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const RideHistoryScreen(),
      ),
    );
  }
}
