import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/providers/ride_provider.dart';
import '../../core/providers/location_provider.dart';
import '../widgets/driver_app_card.dart';
import '../widgets/driver_app_button.dart';
import '../widgets/driver_loading_indicator.dart';

/// BMAD Phase 5: Implement
/// Ride acceptance screen for Tripo04OS Driver App
/// BMAD Principle: Maximize driver earnings with quick ride acceptance
class RideAcceptanceScreen extends StatefulWidget {
  const RideAcceptanceScreen({super.key});

  @override
  State<RideAcceptanceScreen> createState() => _RideAcceptanceScreenState();
}

class _RideAcceptanceScreenState extends State<RideAcceptanceScreen> {
  @override
  void initState() {
    super.initState();
    // BMAD Principle: Auto-listen for ride requests
    _listenForRideRequests();
  }

  void _listenForRideRequests() {
    final rideProvider = context.read<RideProvider>();
    rideProvider.listenForRideRequests();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ride Requests'),
      ),
      body: Consumer<RideProvider>(
        builder: (context, rideProvider, child) {
          if (rideProvider.isLoading) {
            return const DriverLoadingIndicator(
              message: 'Loading ride requests...',
            );
          }
          
          if (rideProvider.rideRequests.isEmpty) {
            return _buildNoRidesScreen(context);
          }
          
          return _buildRideRequestsList(context, rideProvider);
        },
      ),
    );
  }

  Widget _buildNoRidesScreen(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.directions_car,
            size: 80,
            color: Colors.grey[300],
          ),
          const SizedBox(height: 16),
          Text(
            'No Ride Requests',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            'You\'re currently online and waiting for ride requests',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[600],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildRideRequestsList(BuildContext context, RideProvider rideProvider) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: rideProvider.rideRequests.length,
      itemBuilder: (context, index) {
        final rideRequest = rideProvider.rideRequests[index];
        return _buildRideRequestCard(context, rideRequest);
      },
    );
  }

  Widget _buildRideRequestCard(BuildContext context, dynamic rideRequest) {
    return DriverAppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // BMAD Principle: Ride request header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Theme.of(context).primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.person,
                      color: Theme.of(context).primaryColor,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        rideRequest.riderName ?? 'Rider',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      Row(
                        children: [
                          Icon(
                            Icons.star,
                            size: 16,
                            color: Colors.amber[600],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${rideRequest.riderRating ?? 0.0}',
                            style: const TextStyle(
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '\$${rideRequest.fare?.toStringAsFixed(2) ?? '0.00'}',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.green[700],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // BMAD Principle: Ride details
          _buildRideDetails(context, rideRequest),
          const SizedBox(height: 16),
          
          // BMAD Principle: Action buttons
          _buildActionButtons(context, rideRequest),
        ],
      ),
    );
  }

  Widget _buildRideDetails(BuildContext context, dynamic rideRequest) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // BMAD Principle: Pickup location
        _buildDetailRow(
          context,
          icon: Icons.location_on,
          label: 'Pickup',
          value: rideRequest.pickupLocation?.address ?? 'Unknown',
          color: Colors.green,
        ),
        const SizedBox(height: 8),
        
        // BMAD Principle: Dropoff location
        _buildDetailRow(
          context,
          icon: Icons.place,
          label: 'Dropoff',
          value: rideRequest.dropoffLocation?.address ?? 'Unknown',
          color: Colors.red,
        ),
        const SizedBox(height: 8),
        
        // BMAD Principle: Distance and time
        Row(
          children: [
            Expanded(
              child: _buildDetailRow(
                context,
                icon: Icons.straighten,
                label: 'Distance',
                value: '${rideRequest.distance?.toStringAsFixed(1) ?? '0.0'} km',
                color: Colors.grey[600],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildDetailRow(
                context,
                icon: Icons.access_time,
                label: 'ETA',
                value: '${rideRequest.etaMinutes ?? 0} min',
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        
        // BMAD Principle: Service type
        _buildDetailRow(
          context,
          icon: Icons.directions_car,
          label: 'Service',
          value: rideRequest.serviceType ?? 'Ride',
          color: Theme.of(context).primaryColor,
        ),
      ],
    );
  }

  Widget _buildDetailRow(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Row(
      children: [
        Icon(
          icon,
          size: 20,
          color: color,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 10,
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
        ),
      ],
    );
  }

  Widget _buildActionButtons(BuildContext context, dynamic rideRequest) {
    return Row(
      children: [
        Expanded(
          child: DriverAppButton(
            text: 'Accept',
            onPressed: () => _acceptRide(context, rideRequest),
            backgroundColor: Colors.green,
            icon: Icons.check_circle,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: DriverAppButton(
            text: 'Decline',
            onPressed: () => _declineRide(context, rideRequest),
            backgroundColor: Colors.red,
            icon: Icons.cancel,
          ),
        ),
      ],
    );
  }

  Future<void> _acceptRide(BuildContext context, dynamic rideRequest) async {
    final rideProvider = context.read<RideProvider>();
    
    // BMAD Principle: Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Accept Ride'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Pickup: ${rideRequest.pickupLocation?.address ?? 'Unknown'}'),
            Text('Dropoff: ${rideRequest.dropoffLocation?.address ?? 'Unknown'}'),
            Text('Fare: \$${rideRequest.fare?.toStringAsFixed(2) ?? '0.00'}'),
            Text('ETA: ${rideRequest.etaMinutes ?? 0} minutes'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Accept'),
          ),
        ],
      ),
    );
    
    if (confirmed == true && context.mounted) {
      await rideProvider.acceptRide(rideRequest.rideId);
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Ride accepted!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    }
  }

  Future<void> _declineRide(BuildContext context, dynamic rideRequest) async {
    final rideProvider = context.read<RideProvider>();
    
    // BMAD Principle: Show decline reason dialog
    final reason = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Decline Ride'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text('Too far'),
              onTap: () => Navigator.pop(context, 'too_far'),
            ),
            ListTile(
              title: const Text('Wrong direction'),
              onTap: () => Navigator.pop(context, 'wrong_direction'),
            ),
            ListTile(
              title: const Text('Personal reason'),
              onTap: () => Navigator.pop(context, 'personal'),
            ),
            ListTile(
              title: const Text('Other'),
              onTap: () => Navigator.pop(context, 'other'),
            ),
          ],
        ),
      ),
    );
    
    if (reason != null && context.mounted) {
      await rideProvider.declineRide(rideRequest.rideId, reason!);
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Ride declined'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    }
  }
}
