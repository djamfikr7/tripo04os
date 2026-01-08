import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/config/app_config.dart';
import '../../core/providers/booking_provider.dart';
import '../widgets/app_card.dart';
import '../widgets/app_button.dart';
import '../widgets/app_loading_indicator.dart';

/// BMAD Phase 5: Implement
/// Payment screen for Tripo04OS Rider App
/// BMAD Principle: Maximize conversion with seamless payment experience
class PaymentScreen extends StatefulWidget {
  final double amount;
  final String? rideId;
  final VoidCallback? onPaymentComplete;

  const PaymentScreen({
    super.key,
    required this.amount,
    this.rideId,
    this.onPaymentComplete,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  String? _selectedPaymentMethodId;
  double _tipAmount = 0.0;
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _loadPaymentMethods();
  }

  Future<void> _loadPaymentMethods() async {
    final bookingProvider = context.read<BookingProvider>();
    await bookingProvider.loadPaymentMethods();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment'),
      ),
      body: Consumer<BookingProvider>(
        builder: (context, bookingProvider, child) {
          if (bookingProvider.isLoading) {
            return const AppLoadingIndicator(
              message: 'Loading payment methods...',
            );
          }
          
          return Column(
            children: [
              // BMAD Principle: Payment amount display
              _buildAmountDisplay(context),
              
              // BMAD Principle: Payment methods list
              Expanded(
                child: _buildPaymentMethods(context, bookingProvider),
              ),
              
              // BMAD Principle: Tip selection
              _buildTipSection(context),
              
              // BMAD Principle: Pay button
              _buildPayButton(context, bookingProvider),
            ],
          );
        },
      ),
    );
  }

  Widget _buildAmountDisplay(BuildContext context) {
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
            'Total Amount',
            style: const TextStyle(
              fontSize: 16,
              color: Colors.white70,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '\$${(widget.amount + _tipAmount).toStringAsFixed(2)}',
            style: const TextStyle(
              fontSize: 36,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          if (_tipAmount > 0) ...[
            const SizedBox(height: 8),
            Text(
              'Includes \$${_tipAmount.toStringAsFixed(2)} tip',
              style: const TextStyle(
                fontSize: 14,
                color: Colors.white70,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPaymentMethods(BuildContext context, BookingProvider bookingProvider) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Select Payment Method',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 16),
        ...bookingProvider.paymentMethods.map((method) {
          return _buildPaymentMethodCard(context, method);
        }),
        const SizedBox(height: 16),
        AppButton(
          text: 'Add New Payment Method',
          onPressed: () => _addPaymentMethod(context),
          backgroundColor: Colors.grey[200],
          textColor: Colors.black,
        ),
      ],
    );
  }

  Widget _buildPaymentMethodCard(BuildContext context, dynamic paymentMethod) {
    final isSelected = _selectedPaymentMethodId == paymentMethod.id;
    
    return AppCard(
      onTap: () {
        setState(() {
          _selectedPaymentMethodId = paymentMethod.id;
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
              size: 32,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    paymentMethod.name ?? 'Payment Method',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w500,
                        ),
                  ),
                  if (paymentMethod.lastFour != null)
                    Text(
                      '**** ${paymentMethod.lastFour}',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                ],
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
                size: 24,
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

  Widget _buildTipSection(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        border: Border(
          top: BorderSide(color: Colors.grey[300]!),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Add a Tip',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 12),
          Row(
            children: AppConfig.tipPercentages.map((percentage) {
              final tipAmount = widget.amount * percentage;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: GestureDetector(
                    onTap: () {
                      setState(() {
                        _tipAmount = tipAmount;
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: _tipAmount == tipAmount
                            ? Theme.of(context).primaryColor
                            : Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: _tipAmount == tipAmount
                              ? Theme.of(context).primaryColor
                              : Colors.grey[300]!,
                        ),
                      ),
                      child: Text(
                        '${(percentage * 100).toInt()}%',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: _tipAmount == tipAmount
                              ? Colors.white
                              : Colors.black,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Custom tip amount',
                    prefixText: '\$',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  keyboardType: TextInputType.number,
                  onChanged: (value) {
                    final amount = double.tryParse(value);
                    if (amount != null) {
                      setState(() {
                        _tipAmount = amount!;
                      });
                    }
                  },
                ),
              ),
              const SizedBox(width: 12),
              TextButton(
                onPressed: () {
                  setState(() {
                    _tipAmount = 0.0;
                  });
                },
                child: const Text('No Tip'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPayButton(BuildContext context, BookingProvider bookingProvider) {
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
        child: AppButton(
          text: _isProcessing ? 'Processing...' : 'Pay \$${(widget.amount + _tipAmount).toStringAsFixed(2)}',
          onPressed: _selectedPaymentMethodId != null && !_isProcessing
              ? () => _processPayment(context, bookingProvider)
              : null,
          isLoading: _isProcessing,
          isDisabled: _selectedPaymentMethodId == null,
        ),
      ),
    );
  }

  Future<void> _addPaymentMethod(BuildContext context) async {
    // BMAD Principle: Easy payment method addition
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const AddPaymentMethodScreen(),
      ),
    );
    
    // Reload payment methods
    _loadPaymentMethods();
  }

  Future<void> _processPayment(BuildContext context, BookingProvider bookingProvider) async {
    setState(() {
      _isProcessing = true;
    });
    
    try {
      // BMAD Principle: Process payment
      final success = await bookingProvider.processPayment(
        paymentMethodId: _selectedPaymentMethodId!,
        amount: widget.amount + _tipAmount,
        rideId: widget.rideId,
      );
      
      if (success && mounted) {
        // BMAD Principle: Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Payment successful!'),
            backgroundColor: Colors.green,
          ),
        );
        
        // BMAD Principle: Navigate back or complete
        if (widget.onPaymentComplete != null) {
          widget.onPaymentComplete!();
        } else {
          Navigator.pop(context, true);
        }
      }
    } catch (e) {
      if (mounted) {
        // BMAD Principle: Show error message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Payment failed: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
      }
    }
  }
}

/// BMAD Phase 5: Implement
/// Add payment method screen
/// BMAD Principle: Easy payment method setup increases conversion
class AddPaymentMethodScreen extends StatefulWidget {
  const AddPaymentMethodScreen({super.key});

  @override
  State<AddPaymentMethodScreen> createState() => _AddPaymentMethodScreenState();
}

class _AddPaymentMethodScreenState extends State<AddPaymentMethodScreen> {
  final _formKey = GlobalKey<FormState>();
  final _cardNumberController = TextEditingController();
  final _expiryController = TextEditingController();
  final _cvvController = TextEditingController();
  final _cardholderNameController = TextEditingController();
  bool _isDefault = false;
  bool _isSaving = false;

  @override
  void dispose() {
    _cardNumberController.dispose();
    _expiryController.dispose();
    _cvvController.dispose();
    _cardholderNameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Payment Method'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // BMAD Principle: Card information
            Text(
              'Card Information',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _cardNumberController,
              decoration: const InputDecoration(
                labelText: 'Card Number',
                hintText: '1234 5678 9012 3456',
                prefixIcon: Icon(Icons.credit_card),
              ),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter card number';
                }
                if (value.length < 16) {
                  return 'Please enter a valid card number';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _expiryController,
                    decoration: const InputDecoration(
                      labelText: 'Expiry Date',
                      hintText: 'MM/YY',
                      prefixIcon: Icon(Icons.calendar_today),
                    ),
                    keyboardType: TextInputType.number,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter expiry date';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: _cvvController,
                    decoration: const InputDecoration(
                      labelText: 'CVV',
                      hintText: '123',
                      prefixIcon: Icon(Icons.lock),
                    ),
                    keyboardType: TextInputType.number,
                    obscureText: true,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter CVV';
                      }
                      if (value.length < 3) {
                        return 'Please enter a valid CVV';
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _cardholderNameController,
              decoration: const InputDecoration(
                labelText: 'Cardholder Name',
                hintText: 'John Doe',
                prefixIcon: Icon(Icons.person),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter cardholder name';
                }
                return null;
              },
            ),
            const SizedBox(height: 24),
            
            // BMAD Principle: Default payment method
            CheckboxListTile(
              title: const Text('Set as default payment method'),
              value: _isDefault,
              onChanged: (value) {
                setState(() {
                  _isDefault = value ?? false;
                });
              },
            ),
            const SizedBox(height: 24),
            
            // BMAD Principle: Save button
            AppButton(
              text: _isSaving ? 'Saving...' : 'Save Payment Method',
              onPressed: _isSaving ? null : _savePaymentMethod,
              isLoading: _isSaving,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _savePaymentMethod() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    
    setState(() {
      _isSaving = true;
    });
    
    try {
      // BMAD Principle: Save payment method
      // In production, integrate with payment gateway
      await Future.delayed(const Duration(seconds: 2));
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Payment method added successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to add payment method: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }
}
