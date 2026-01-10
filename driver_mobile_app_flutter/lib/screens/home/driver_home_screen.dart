import 'dart:math';

import '../models/driver_models.dart';

/// BMAD Phase 5: Implement
/// Driver home screen with multi-service support
/// BMAD Principle: Clear dashboard increases driver engagement
class DriverHomeScreen extends StatefulWidget {
  const DriverHomeScreen({super.key});

  @override
  State<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends State<DriverHomeScreen> {
  DriverStatus _currentStatus = DriverStatus.offline;
  int _selectedIndex = 0;
  int _unseenNotifications = 0;

  @override
  void initState() {
    super.initState();
    _loadDriverData();
    _checkNotifications();
  }

  Future<void> _loadDriverData() async {
    // BMAD Principle: Load data asynchronously to prevent blocking
    await Future.delayed(const Duration(milliseconds: 500));
    setState(() {
      _currentStatus = DriverStatus.available;
    });
  }

  Future<void> _checkNotifications() async {
    setState(() {
      _unseenNotifications = 3;
    });
  }

  void _goOnline() {
    setState(() {
      _currentStatus = DriverStatus.available;
    });
    // TODO: Connect to backend
  }

  void _goOffline() {
    setState(() {
      _currentStatus = DriverStatus.offline;
    });
    // TODO: Disconnect from backend
  }

  void _onNavTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar.large(
            title: Text(
              'Tripo04OS',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            expandedHeight: 120,
            flexibleSpace: false,
            pinned: true,
            background: AppBar(
              leading: Padding(
                padding: const EdgeInsets.all(16),
                child: CircleAvatar(
                  backgroundImage: AssetImage(
                    'assets/images/driver_avatar.png',
                  ),
                  radius: 28,
                ),
              ),
              actions: [
                Stack(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.notifications),
                      onPressed: () {},
                      color: Colors.white,
                    ),
                    if (_unseenNotifications > 0)
                      Positioned(
                        right: 8,
                        top: 8,
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                          constraints: const BoxConstraints(
                            minWidth: 18,
                            minHeight: 18,
                          ),
                          child: Text(
                            '$_unseenNotifications',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _buildStatusCard(),
                  const SizedBox(height: 16),
                  _buildTodayStats(),
                  const SizedBox(height: 16),
                  _buildEarningsCard(),
                  const SizedBox(height: 16),
                  _buildServiceSelector(),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildStatusCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.blue.withOpacity(0.1), Colors.blue.withOpacity(0.2)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Text(
            'Status',
            style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.circle, color: _getStatusColor(), size: 12),
              const SizedBox(width: 12),
              Text(
                _getStatusText(),
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: _getStatusColor(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: _goOnline,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('GO ONLINE'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton(
                  onPressed: _goOffline,
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: Colors.red, width: 2),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('GO OFFLINE'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _getStatusColor() {
    switch (_currentStatus) {
      case DriverStatus.available:
        return Colors.green;
      case DriverStatus.offline:
        return Colors.red;
      case DriverStatus.enRoute:
        return Colors.orange;
      case DriverStatus.onBreak:
        return Colors.grey;
      case DriverStatus.busy:
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText() {
    switch (_currentStatus) {
      case DriverStatus.available:
        return 'Available';
      case DriverStatus.offline:
        return 'Offline';
      case DriverStatus.enRoute:
        return 'On Trip';
      case DriverStatus.onBreak:
        return 'On Break';
      case DriverStatus.busy:
        return 'Busy';
      default:
        return 'Unknown';
    }
  }

  Widget _buildTodayStats() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Today\'s Stats',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildStatItem('8 Trips', Icons.directions_car),
                _buildStatItem('\$145.50', Icons.attach_money),
              ],
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildStatItem('4h 30m', Icons.access_time),
                _buildStatItem('4.8/5', Icons.star),
              ],
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildStatItem('\$33.50/hr', Icons.speed),
                _buildStatItem('92%', Icons.check_circle),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, IconData icon) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: Colors.grey.shade600, size: 20),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(fontSize: 14, color: Colors.grey.shade700),
          ),
        ],
      ),
    );
  }

  Widget _buildEarningsCard() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Weekly Earnings',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 16),
            Text(
              '\$892.50',
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Colors.green,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.arrow_upward, color: Colors.green, size: 16),
                const SizedBox(width: 4),
                Text(
                  '+12.5% from last week',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.green,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                _buildEarningsBar('Ride', 520.0, 30),
                const SizedBox(width: 12),
                _buildEarningsBar('Food', 250.0, 15),
                const SizedBox(width: 12),
                _buildEarningsBar('Grocery', 80.0, 8),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                _buildEarningsBar('Goods', 25.0, 3),
                const SizedBox(width: 12),
                _buildEarningsBar('Truck', 17.5, 2),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEarningsBar(String label, double amount, int percentage) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
          ),
          const SizedBox(height: 8),
          Container(
            height: 8,
            decoration: BoxDecoration(
              color: Colors.blue.shade100,
              borderRadius: BorderRadius.circular(4),
            ),
            child: FractionallySizedBox(
              widthFactor: percentage / 100,
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.blue,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '\$$amount',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  Widget _buildServiceSelector() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Available Services',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 16),
            GridView.count(
              crossAxisCount: 3,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              children: const [
                _buildServiceCard(Icons.directions_car, 'Ride', '30 trips'),
                _buildServiceCard(Icons.two_wheeler, 'Moto', '15 trips'),
                _buildServiceCard(Icons.restaurant, 'Food', '8 trips'),
                _buildServiceCard(Icons.shopping_cart, 'Grocery', '5 trips'),
                _buildServiceCard(Icons.local_shipping, 'Goods', '3 trips'),
                _buildServiceCard(Icons.local_taxi, 'Truck', '2 trips'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildServiceCard(IconData icon, String label, String trips) {
    return InkWell(
      onTap: () {},
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Icon(icon, color: Colors.blue, size: 32),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 4),
            Text(
              trips,
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildNavItem(Icons.home, 'Home', 0),
            _buildNavItem(Icons.history, 'History', 1),
            _buildNavItem(Icons.attach_money, 'Earnings', 2),
            _buildNavItem(Icons.calendar_today, 'Schedule', 3),
            _buildNavItem(Icons.person, 'Profile', 4),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String label, int index) {
    final isSelected = _selectedIndex == index;
    return GestureDetector(
      onTap: () => _onNavTapped(index),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected ? Colors.blue : Colors.grey.shade400,
              size: 24,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: isSelected ? Colors.blue : Colors.grey.shade400,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
