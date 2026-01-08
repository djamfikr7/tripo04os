import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/models/ride_models.dart';
import '../../core/providers/booking_provider.dart';
import '../widgets/app_card.dart';
import '../widgets/app_loading_indicator.dart';
import '../widgets/app_empty_state.dart';

/// BMAD Phase 5: Implement
/// Ride history screen for Tripo04OS Rider App
/// BMAD Principle: Maximize user engagement with comprehensive ride history
class RideHistoryScreen extends StatefulWidget {
  const RideHistoryScreen({super.key});

  @override
  State<RideHistoryScreen> createState() => _RideHistoryScreenState();
}

class _RideHistoryScreenState extends State<RideHistoryScreen> {
  String _selectedFilter = 'all';
  DateTime? _startDate;
  DateTime? _endDate;

  @override
  void initState() {
    super.initState();
    _loadRideHistory();
  }

  Future<void> _loadRideHistory() async {
    final bookingProvider = context.read<BookingProvider>();
    await bookingProvider.loadRideHistory();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Your Trips'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () => _showFilterDialog(context),
          ),
        ],
      ),
      body: Consumer<BookingProvider>(
        builder: (context, bookingProvider, child) {
          if (bookingProvider.isLoading) {
            return const AppLoadingIndicator(
              message: 'Loading ride history...',
            );
          }
          
          final rides = _filterRides(bookingProvider.rideHistory);
          
          if (rides.isEmpty) {
            return const AppEmptyState(
              title: 'No rides found',
              message: 'You haven\'t taken any rides yet',
              icon: Icons.history,
            );
          }
          
          return Column(
            children: [
              // BMAD Principle: Filter chips
              _buildFilterChips(context),
              
              // BMAD Principle: Ride list
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: rides.length,
                  itemBuilder: (context, index) {
                    return _buildRideCard(context, rides[index]);
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildFilterChips(BuildContext context) {
    final filters = [
      {'value': 'all', 'label': 'All'},
      {'value': 'completed', 'label': 'Completed'},
      {'value': 'cancelled', 'label': 'Cancelled'},
    ];
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: filters.map((filter) {
            final isSelected = _selectedFilter == filter['value'];
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: Text(filter['label']!),
                selected: isSelected,
                onSelected: (selected) {
                  if (selected) {
                    setState(() {
                      _selectedFilter = filter['value']!;
                    });
                  }
                },
                selectedColor: Theme.of(context).primaryColor.withOpacity(0.2),
                checkmarkColor: Theme.of(context).primaryColor,
                labelStyle: TextStyle(
                  color: isSelected
                      ? Theme.of(context).primaryColor
                      : Colors.grey[600],
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildRideCard(BuildContext context, Ride ride) {
    return AppCard(
      onTap: () => _showRideDetails(context, ride),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // BMAD Principle: Ride header with status
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _formatDate(ride.createdAt),
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _getStatusColor(ride.status).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  _getStatusText(ride.status),
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: _getStatusColor(ride.status),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // BMAD Principle: Ride route
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.circle,
                          size: 8,
                          color: Colors.green,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            ride.pickupLocation.address ?? 'Pickup',
                            style: Theme.of(context).textTheme.bodyMedium,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.location_on,
                          size: 8,
                          color: Colors.red,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            ride.dropoffLocation.address ?? 'Dropoff',
                            style: Theme.of(context).textTheme.bodyMedium,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              // BMAD Principle: Service type icon
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Theme.of(context).primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    ride.serviceType.emoji,
                    style: const TextStyle(fontSize: 24),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // BMAD Principle: Ride details
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${ride.vehicleType.displayName} • ${ride.durationMinutes ?? 0} min',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
              Text(
                '\$${ride.fareEstimate.toStringAsFixed(2)}',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).primaryColor,
                    ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  List<Ride> _filterRides(List<Ride> rides) {
    switch (_selectedFilter) {
      case 'completed':
        return rides.where((ride) => ride.isCompleted).toList();
      case 'cancelled':
        return rides.where((ride) => ride.isCancelled).toList();
      default:
        return rides;
    }
  }

  String _formatDate(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inDays == 0) {
      return 'Today';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
    }
  }

  Color _getStatusColor(RideStatus status) {
    switch (status) {
      case RideStatus.completed:
        return Colors.green;
      case RideStatus.cancelled:
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(RideStatus status) {
    switch (status) {
      case RideStatus.completed:
        return 'Completed';
      case RideStatus.cancelled:
        return 'Cancelled';
      default:
        return 'In Progress';
    }
  }

  void _showFilterDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Filter Rides'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text('Start Date'),
              trailing: Text(
                _startDate != null
                    ? '${_startDate!.day}/${_startDate!.month}/${_startDate!.year}'
                    : 'Select',
              ),
              onTap: () => _selectStartDate(context),
            ),
            ListTile(
              title: const Text('End Date'),
              trailing: Text(
                _endDate != null
                    ? '${_endDate!.day}/${_endDate!.month}/${_endDate!.year}'
                    : 'Select',
              ),
              onTap: () => _selectEndDate(context),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              setState(() {
                _selectedFilter = 'all';
                _startDate = null;
                _endDate = null;
              });
              Navigator.pop(context);
            },
            child: const Text('Clear'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Apply'),
          ),
        ],
      ),
    );
  }

  Future<void> _selectStartDate(BuildContext context) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _startDate ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    
    if (picked != null && mounted) {
      setState(() {
        _startDate = picked;
      });
    }
  }

  Future<void> _selectEndDate(BuildContext context) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _endDate ?? DateTime.now(),
      firstDate: _startDate ?? DateTime(2020),
      lastDate: DateTime.now(),
    );
    
    if (picked != null && mounted) {
      setState(() {
        _endDate = picked;
      });
    }
  }

  void _showRideDetails(BuildContext context, Ride ride) {
    // BMAD Principle: Detailed ride information
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        builder: (context, scrollController) {
          return Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
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
                
                // BMAD Principle: Ride details
                Expanded(
                  child: ListView(
                    controller: scrollController,
                    padding: const EdgeInsets.all(16),
                    children: [
                      Text(
                        'Ride Details',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 16),
                      _buildDetailRow(
                        'Service Type',
                        ride.serviceType.displayName,
                      ),
                      _buildDetailRow(
                        'Vehicle Type',
                        ride.vehicleType.displayName,
                      ),
                      _buildDetailRow(
                        'Pickup',
                        ride.pickupLocation.address ?? 'Unknown',
                      ),
                      _buildDetailRow(
                        'Dropoff',
                        ride.dropoffLocation.address ?? 'Unknown',
                      ),
                      _buildDetailRow(
                        'Date & Time',
                        '${_formatDate(ride.createdAt)} at ${ride.createdAt.hour}:${ride.createdAt.minute.toString().padLeft(2, '0')}',
                      ),
                      _buildDetailRow(
                        'Duration',
                        '${ride.durationMinutes ?? 0} minutes',
                      ),
                      _buildDetailRow(
                        'Fare',
                        '\$${ride.fareEstimate.toStringAsFixed(2)}',
                      ),
                      if (ride.driverInfo != null) ...[
                        const SizedBox(height: 16),
                        Text(
                          'Driver',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 24,
                              backgroundImage: ride.driverInfo!.photoUrl != null
                                  ? NetworkImage(ride.driverInfo!.photoUrl!)
                                  : null,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    ride.driverInfo!.name,
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
                                        ride.driverInfo!.rating.toStringAsFixed(1),
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          );
        },
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
}
