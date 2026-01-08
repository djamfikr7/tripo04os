import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/providers/earnings_provider.dart';
import '../widgets/driver_app_card.dart';
import '../widgets/driver_app_button.dart';
import '../widgets/driver_loading_indicator.dart';

/// BMAD Phase 5: Implement
/// Earnings screen for Tripo04OS Driver App
/// BMAD Principle: Maximize driver earnings with transparent earnings display
class EarningsScreen extends StatefulWidget {
  const EarningsScreen({super.key});

  @override
  State<EarningsScreen> createState() => _EarningsScreenState();
}

class _EarningsScreenState extends State<EarningsScreen> {
  String _selectedPeriod = 'today';
  DateTimeRange? _customDateRange;

  @override
  void initState() {
    super.initState();
    // BMAD Principle: Auto-load earnings data
    _loadEarnings();
  }

  Future<void> _loadEarnings() async {
    final earningsProvider = context.read<EarningsProvider>();
    await earningsProvider.loadEarnings(period: _selectedPeriod);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Earnings'),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_today),
            onPressed: () => _selectDateRange(context),
          ),
        ],
      ),
      body: Consumer<EarningsProvider>(
        builder: (context, earningsProvider, child) {
          if (earningsProvider.isLoading) {
            return const DriverLoadingIndicator(
              message: 'Loading earnings...',
            );
          }
          
          return Column(
            children: [
              // BMAD Principle: Period selector
              _buildPeriodSelector(context),
              
              // BMAD Principle: Earnings summary
              _buildEarningsSummary(context, earningsProvider),
              
              // BMAD Principle: Earnings breakdown
              Expanded(
                child: _buildEarningsBreakdown(context, earningsProvider),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildPeriodSelector(BuildContext context) {
    final periods = [
      {'value': 'today', 'label': 'Today'},
      {'value': 'week', 'label': 'This Week'},
      {'value': 'month', 'label': 'This Month'},
      {'value': 'year', 'label': 'This Year'},
      {'value': 'custom', 'label': 'Custom'},
    ];
    
    return Container(
      padding: const EdgeInsets.all(16),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: periods.map((period) {
            final isSelected = _selectedPeriod == period['value'];
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: FilterChip(
                label: Text(period['label']!),
                selected: isSelected,
                onSelected: (selected) {
                  if (selected) {
                    setState(() {
                      _selectedPeriod = period['value']!;
                    });
                    _loadEarnings();
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

  Widget _buildEarningsSummary(BuildContext context, EarningsProvider earningsProvider) {
    return Container(
      padding: const EdgeInsets.all(16),
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
            'Total Earnings',
            style: const TextStyle(
              fontSize: 16,
              color: Colors.white70,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '\$${earningsProvider.totalEarnings.toStringAsFixed(2)}',
            style: const TextStyle(
              fontSize: 36,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildSummaryItem(
                'Rides',
                '${earningsProvider.totalRides}',
              ),
              _buildSummaryItem(
                'Hours',
                '${earningsProvider.totalHours}h',
              ),
              _buildSummaryItem(
                'Avg/Ride',
                '\$${earningsProvider.averagePerRide.toStringAsFixed(2)}',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.white70,
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ],
    );
  }

  Widget _buildEarningsBreakdown(BuildContext context, EarningsProvider earningsProvider) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Earnings Breakdown',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 16),
          
          // BMAD Principle: Base fare earnings
          DriverAppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Base Fare',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      '\$${earningsProvider.baseFare.toStringAsFixed(2)}',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).primaryColor,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: earningsProvider.totalEarnings > 0
                      ? earningsProvider.baseFare / earningsProvider.totalEarnings
                      : 0.0,
                  backgroundColor: Colors.grey[200],
                  valueColor: AlwaysStoppedAnimation<Color>(
                    Theme.of(context).primaryColor,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          
          // BMAD Principle: Tips earnings
          DriverAppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Tips',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      '\$${earningsProvider.tips.toStringAsFixed(2)}',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.amber[700],
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: earningsProvider.totalEarnings > 0
                      ? earningsProvider.tips / earningsProvider.totalEarnings
                      : 0.0,
                  backgroundColor: Colors.grey[200],
                  valueColor: AlwaysStoppedAnimation<Color>(
                    Colors.amber[700],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          
          // BMAD Principle: Bonuses earnings
          DriverAppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Bonuses',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(
                      '\$${earningsProvider.bonuses.toStringAsFixed(2)}',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.green[700],
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: earningsProvider.totalEarnings > 0
                      ? earningsProvider.bonuses / earningsProvider.totalEarnings
                      : 0.0,
                  backgroundColor: Colors.grey[200],
                  valueColor: AlwaysStoppedAnimation<Color>(
                    Colors.green[700],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          
          // BMAD Principle: Daily earnings chart
          DriverAppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Daily Earnings',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 16),
                _buildDailyEarningsChart(earningsProvider),
              ],
            ),
          ),
          const SizedBox(height: 16),
          
          // BMAD Principle: Withdraw button
          DriverAppButton(
            text: 'Withdraw Earnings',
            onPressed: () => _showWithdrawDialog(context),
            icon: Icons.account_balance_wallet,
          ),
        ],
      ),
    );
  }

  Widget _buildDailyEarningsChart(EarningsProvider earningsProvider) {
    final dailyEarnings = earningsProvider.dailyEarnings;
    final maxEarnings = dailyEarnings.isNotEmpty
        ? dailyEarnings.reduce((a, b) => a.earnings > b.earnings ? a : b).earnings
        : 100.0;
    
    return Container(
      height: 200,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Expanded(
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: dailyEarnings.length,
              itemBuilder: (context, index) {
                final dayEarnings = dailyEarnings[index];
                final height = dayEarnings.earnings / maxEarnings * 160;
                
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Container(
                        width: 40,
                        height: height,
                        decoration: BoxDecoration(
                          color: Theme.of(context).primaryColor,
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '\$${dayEarnings.earnings.toStringAsFixed(0)}',
                        style: TextStyle(
                          fontSize: 10,
                          color: Colors.grey[600],
                        ),
                      ),
                      Text(
                        dayEarnings.day,
                        style: TextStyle(
                          fontSize: 10,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _selectDateRange(BuildContext context) async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      initialDateRange: _customDateRange,
      initialEntryMode: DatePickerEntryMode.calendarOnly,
    );
    
    if (picked != null && mounted) {
      setState(() {
        _customDateRange = picked;
        _selectedPeriod = 'custom';
      });
      _loadEarnings();
    }
  }

  Future<void> _showWithdrawDialog(BuildContext context) async {
    final earningsProvider = context.read<EarningsProvider>();
    
    final amount = await showDialog<double>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Withdraw Earnings'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Available Balance: \$${earningsProvider.availableBalance.toStringAsFixed(2)}',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 16),
            TextField(
              decoration: const InputDecoration(
                labelText: 'Withdrawal Amount',
                prefixText: '\$',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.number,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, 100.0),
            child: const Text('Withdraw'),
          ),
        ],
      ),
    );
    
    if (amount != null && amount > 0 && context.mounted) {
      await earningsProvider.withdrawEarnings(amount);
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Withdrawal request submitted!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    }
  }
}
