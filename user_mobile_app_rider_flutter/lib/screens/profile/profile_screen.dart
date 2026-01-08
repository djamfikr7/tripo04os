import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/config/app_config.dart';
import '../../core/providers/auth_provider.dart';
import '../widgets/app_card.dart';
import '../widgets/app_button.dart';

/// BMAD Phase 5: Implement
/// Profile screen for Tripo04OS Rider App
/// BMAD Principle: Maximize user engagement with comprehensive profile management
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          final user = authProvider.user;
          
          return CustomScrollView(
            slivers: [
              // BMAD Principle: User profile header
              SliverToBoxAdapter(
                child: _buildProfileHeader(context, user),
              ),
              
              // BMAD Principle: Account settings
              SliverToBoxAdapter(
                child: _buildAccountSection(context),
              ),
              
              // BMAD Principle: Payment methods
              SliverToBoxAdapter(
                child: _buildPaymentSection(context),
              ),
              
              // BMAD Principle: App settings
              SliverToBoxAdapter(
                child: _buildSettingsSection(context),
              ),
              
              // BMAD Principle: Support and help
              SliverToBoxAdapter(
                child: _buildSupportSection(context),
              ),
              
              // BMAD Principle: Logout button
              SliverToBoxAdapter(
                child: _buildLogoutSection(context, authProvider),
              ),
              
              // BMAD Principle: Bottom padding
              const SliverToBoxAdapter(
                child: SizedBox(height: 32),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildProfileHeader(BuildContext context, dynamic user) {
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
          // BMAD Principle: Profile picture
          CircleAvatar(
            radius: 50,
            backgroundColor: Colors.white,
            backgroundImage: user?.photoUrl != null
                ? NetworkImage(user!.photoUrl)
                : null,
            child: user?.photoUrl == null
                ? Icon(
                    Icons.person,
                    size: 50,
                    color: Theme.of(context).primaryColor,
                  )
                : null,
          ),
          const SizedBox(height: 16),
          // BMAD Principle: User name
          Text(
            user?.name ?? 'User Name',
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          // BMAD Principle: User email
          Text(
            user?.email ?? 'user@example.com',
            style: const TextStyle(
              fontSize: 14,
              color: Colors.white70,
            ),
          ),
          const SizedBox(height: 16),
          // BMAD Principle: User stats
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem(
                'Rides',
                '${user?.totalRides ?? 0}',
              ),
              _buildStatItem(
                'Rating',
                '${user?.rating?.toStringAsFixed(1) ?? '0.0'}',
              ),
              _buildStatItem(
                'Member',
                _formatMemberSince(user?.memberSince),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.white70,
          ),
        ),
      ],
    );
  }

  String _formatMemberSince(DateTime? date) {
    if (date == null) return 'N/A';
    return '${date.month}/${date.year}';
  }

  Widget _buildAccountSection(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Account',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 12),
          AppCard(
            child: Column(
              children: [
                _buildProfileItem(
                  context,
                  icon: Icons.person,
                  title: 'Personal Information',
                  subtitle: 'Update your personal details',
                  onTap: () => _navigateToPersonalInfo(context),
                ),
                const Divider(),
                _buildProfileItem(
                  context,
                  icon: Icons.phone,
                  title: 'Phone Number',
                  subtitle: 'Update your phone number',
                  onTap: () => _navigateToPhone(context),
                ),
                const Divider(),
                _buildProfileItem(
                  context,
                  icon: Icons.email,
                  title: 'Email Address',
                  subtitle: 'Update your email address',
                  onTap: () => _navigateToEmail(context),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentSection(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Payment',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 12),
          AppCard(
            child: Column(
              children: [
                _buildProfileItem(
                  context,
                  icon: Icons.credit_card,
                  title: 'Payment Methods',
                  subtitle: 'Manage your payment methods',
                  onTap: () => _navigateToPaymentMethods(context),
                ),
                const Divider(),
                _buildProfileItem(
                  context,
                  icon: Icons.receipt_long,
                  title: 'Payment History',
                  subtitle: 'View your payment history',
                  onTap: () => _navigateToPaymentHistory(context),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsSection(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Settings',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 12),
          AppCard(
            child: Column(
              children: [
                _buildProfileItem(
                  context,
                  icon: Icons.notifications,
                  title: 'Notifications',
                  subtitle: 'Manage notification preferences',
                  onTap: () => _navigateToNotifications(context),
                ),
                const Divider(),
                _buildProfileItem(
                  context,
                  icon: Icons.location_on,
                  title: 'Location Services',
                  subtitle: 'Manage location permissions',
                  onTap: () => _navigateToLocationSettings(context),
                ),
                const Divider(),
                _buildProfileItem(
                  context,
                  icon: Icons.lock,
                  title: 'Privacy',
                  subtitle: 'Manage your privacy settings',
                  onTap: () => _navigateToPrivacy(context),
                ),
                const Divider(),
                _buildProfileItem(
                  context,
                  icon: Icons.language,
                  title: 'Language',
                  subtitle: 'Change app language',
                  onTap: () => _navigateToLanguage(context),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSupportSection(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Support',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 12),
          AppCard(
            child: Column(
              children: [
                _buildProfileItem(
                  context,
                  icon: Icons.help,
                  title: 'Help Center',
                  subtitle: 'Get help with common issues',
                  onTap: () => _navigateToHelpCenter(context),
                ),
                const Divider(),
                _buildProfileItem(
                  context,
                  icon: Icons.contact_support,
                  title: 'Contact Support',
                  subtitle: 'Get in touch with our team',
                  onTap: () => _navigateToContactSupport(context),
                ),
                const Divider(),
                _buildProfileItem(
                  context,
                  icon: Icons.description,
                  title: 'Terms of Service',
                  subtitle: 'Read our terms and conditions',
                  onTap: () => _navigateToTerms(context),
                ),
                const Divider(),
                _buildProfileItem(
                  context,
                  icon: Icons.privacy_tip,
                  title: 'Privacy Policy',
                  subtitle: 'Read our privacy policy',
                  onTap: () => _navigateToPrivacyPolicy(context),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLogoutSection(BuildContext context, AuthProvider authProvider) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: AppButton(
        text: 'Logout',
        onPressed: () => _handleLogout(context, authProvider),
        backgroundColor: Colors.red,
      ),
    );
  }

  Widget _buildProfileItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
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
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                  ),
                  Text(
                    subtitle,
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
      ),
    );
  }

  void _navigateToPersonalInfo(BuildContext context) {
    // BMAD Principle: Easy access to personal information
    Navigator.pushNamed(context, '/personal-info');
  }

  void _navigateToPhone(BuildContext context) {
    // BMAD Principle: Easy phone number update
    Navigator.pushNamed(context, '/phone');
  }

  void _navigateToEmail(BuildContext context) {
    // BMAD Principle: Easy email update
    Navigator.pushNamed(context, '/email');
  }

  void _navigateToPaymentMethods(BuildContext context) {
    // BMAD Principle: Easy payment method management
    Navigator.pushNamed(context, '/payment-methods');
  }

  void _navigateToPaymentHistory(BuildContext context) {
    // BMAD Principle: Easy payment history access
    Navigator.pushNamed(context, '/payment-history');
  }

  void _navigateToNotifications(BuildContext context) {
    // BMAD Principle: Easy notification settings access
    Navigator.pushNamed(context, '/notifications');
  }

  void _navigateToLocationSettings(BuildContext context) {
    // BMAD Principle: Easy location settings access
    Navigator.pushNamed(context, '/location-settings');
  }

  void _navigateToPrivacy(BuildContext context) {
    // BMAD Principle: Easy privacy settings access
    Navigator.pushNamed(context, '/privacy');
  }

  void _navigateToLanguage(BuildContext context) {
    // BMAD Principle: Easy language selection
    Navigator.pushNamed(context, '/language');
  }

  void _navigateToHelpCenter(BuildContext context) {
    // BMAD Principle: Easy help center access
    Navigator.pushNamed(context, '/help-center');
  }

  void _navigateToContactSupport(BuildContext context) {
    // BMAD Principle: Easy support contact
    Navigator.pushNamed(context, '/contact-support');
  }

  void _navigateToTerms(BuildContext context) async {
    // BMAD Principle: Easy terms of service access
    final Uri uri = Uri.parse(AppConfig.termsOfServiceUrl);
    // In production, use url_launcher
  }

  void _navigateToPrivacyPolicy(BuildContext context) async {
    // BMAD Principle: Easy privacy policy access
    final Uri uri = Uri.parse(AppConfig.privacyPolicyUrl);
    // In production, use url_launcher
  }

  Future<void> _handleLogout(BuildContext context, AuthProvider authProvider) async {
    // BMAD Principle: Easy logout with confirmation
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
    
    if (confirmed == true && context.mounted) {
      await authProvider.logout();
      if (context.mounted) {
        Navigator.pushReplacementNamed(context, '/login');
      }
    }
  }
}
