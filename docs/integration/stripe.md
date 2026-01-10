# Stripe Payment Integration Guide

Complete guide for integrating Stripe payment processing with Tripo04OS platform.

## Overview

Stripe provides:
- **Payment Processing**: Credit/debit cards, digital wallets
- **Subscription Billing**: Recurring payments
- **Connect**: Driver payouts
- **Webhooks**: Real-time payment notifications
- **Dispute Resolution**: Chargeback management

## Architecture

```
[Client Apps & Web]
        ↓
[Payment Service]
        ↓
[Stripe API]
    ├─ Payments
    ├─ Subscriptions
    ├─ Connect
    └─ Webhooks
        ↓
[Stripe]
    [Banks & Card Networks]
```

## Setup

### 1. Create Stripe Account

```bash
# 1. Go to https://dashboard.stripe.com/
# 2. Sign up for account
# 3. Complete account verification
# 4. Enable test mode
```

### 2. Get API Keys

```bash
# 1. Navigate to Developers > API keys
# 2. Copy Publishable key (pk_test_...)
# 3. Copy Secret key (sk_test_...)
# 4. For production, use live keys (pk_live_..., sk_live_...)
```

### 3. Configure Webhooks

```bash
# 1. Navigate to Developers > Webhooks
# 2. Add endpoint: https://api.tripo04os.com/v1/payment/webhook
# 3. Select events to listen to:
#    - payment_intent.succeeded
#    - payment_intent.payment_failed
#    - payment_intent.canceled
#    - charge.refunded
#    - charge.dispute.created
# 4. Copy webhook secret (whsec_...)
```

### 4. Enable Payment Methods

```bash
# 1. Navigate to Settings > Payment methods
# 2. Enable:
#    - Cards (Visa, Mastercard, Amex)
#    - Apple Pay
#    - Google Pay
#    - Cash App Pay
#    - Afterpay / Clearpay
```

## Backend Integration

### Go Service Configuration

Create `backend_services/payment_service/config/stripe.go`:

```go
package config

import (
    "os"
)

type StripeConfig struct {
    SecretKey      string
    PublishableKey string
    WebhookSecret  string
    Currency        string
    SuccessURL     string
    CancelURL      string
}

func LoadConfig() (*StripeConfig, error) {
    config := &StripeConfig{
        SecretKey:      os.Getenv("STRIPE_SECRET_KEY"),
        PublishableKey: os.Getenv("STRIPE_PUBLISHABLE_KEY"),
        WebhookSecret:  os.Getenv("STRIPE_WEBHOOK_SECRET"),
        Currency:        os.Getenv("STRIPE_CURRENCY"),
        SuccessURL:     os.Getenv("STRIPE_SUCCESS_URL"),
        CancelURL:      os.Getenv("STRIPE_CANCEL_URL"),
    }

    // Validate config
    if config.SecretKey == "" {
        return nil, fmt.Errorf("STRIPE_SECRET_KEY is required")
    }
    if config.PublishableKey == "" {
        return nil, fmt.Errorf("STRIPE_PUBLISHABLE_KEY is required")
    }
    if config.Currency == "" {
        config.Currency = "usd"
    }

    return config, nil
}
```

### Initialize Stripe Client

Create `backend_services/payment_service/stripe/client.go`:

```go
package stripe

import (
    "github.com/stripe/stripe-go/v74"
    "tripo04os/payment_service/config"
)

var (
    stripeClient *stripe.Client
    cfg         *config.StripeConfig
)

func Initialize(config *config.StripeConfig) error {
    cfg = config
    
    stripe.Key = cfg.SecretKey
    stripeClient = stripe.NewClient(cfg.SecretKey)
    
    return nil
}

func GetClient() *stripe.Client {
    return stripeClient
}

func GetConfig() *config.StripeConfig {
    return cfg
}
```

### Payment Intent Creation

Create `backend_services/payment_service/handlers/payment.go`:

```go
package handlers

import (
    "github.com/appleboy/gin"
    "github.com/stripe/stripe-go/v74"
    stripe "github.com/stripe/stripe-go/v74/paymentintent"
    "tripo04os/payment_service/stripe"
)

type CreatePaymentIntentRequest struct {
    OrderID   string  `json:"orderId" binding:"required"`
    Amount     float64  `json:"amount" binding:"required,min=0.01"`
    Currency   string  `json:"currency"`
    CustomerID string  `json:"customerId"`
    PaymentMethod string `json:"paymentMethod"`
}

type CreatePaymentIntentResponse struct {
    Success     bool   `json:"success"`
    ClientSecret string `json:"clientSecret"`
    PaymentID   string `json:"paymentId"`
}

func CreatePaymentIntent(c *gin.Context) {
    var req CreatePaymentIntentRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }

    // Convert amount to cents
    amount := int64(req.Amount * 100)
    if req.Currency == "" {
        req.Currency = stripe.GetConfig().Currency
    }

    // Create payment intent
    params := &stripe.PaymentIntentParams{
        Amount:   stripe.Int64(amount),
        Currency: stripe.String(req.Currency),
        Customer: stripe.String(req.CustomerID),
        PaymentMethodTypes: stripe.StringSlice([]string{
            "card",
        }),
        PaymentMethod: stripe.String(req.PaymentMethod),
        Metadata: map[string]string{
            "order_id":    req.OrderID,
            "user_id":     c.GetString("user_id"),
        },
    }

    intent, err := stripe.GetClient().PaymentIntents.New(params)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }

    c.JSON(200, CreatePaymentIntentResponse{
        Success:     true,
        ClientSecret: intent.ClientSecret,
        PaymentID:   intent.ID,
    })
}
```

### Confirm Payment

```go
type ConfirmPaymentRequest struct {
    PaymentIntentID string `json:"paymentIntentId" binding:"required"`
}

type ConfirmPaymentResponse struct {
    Success bool   `json:"success"`
    Status  string `json:"status"`
}

func ConfirmPayment(c *gin.Context) {
    var req ConfirmPaymentRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }

    // Confirm payment intent
    params := &stripe.PaymentIntentConfirmParams{
        PaymentMethod: stripe.String(req.PaymentIntentID),
    }

    intent, err := stripe.GetClient().PaymentIntents.Confirm(
        req.PaymentIntentID,
        params,
    )
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }

    c.JSON(200, ConfirmPaymentResponse{
        Success: true,
        Status:  string(intent.Status),
    })
}
```

### Webhook Handler

Create `backend_services/payment_service/handlers/webhook.go`:

```go
package handlers

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "io"
    "github.com/appleboy/gin"
    "github.com/stripe/stripe-go/v74/webhook"
    "tripo04os/payment_service/stripe"
)

func HandleWebhook(c *gin.Context) {
    payload, err := io.ReadAll(c.Request.Body)
    if err != nil {
        c.JSON(400, gin.H{"error": "Failed to read body"})
        return
    }

    // Verify webhook signature
    signature := c.GetHeader("Stripe-Signature")
    if signature == "" {
        c.JSON(400, gin.H{"error": "Missing Stripe signature"})
        return
    }

    event, err := webhook.ConstructEvent(payload, stripe.GetConfig().WebhookSecret, signature)
    if err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }

    // Handle event
    switch event.Type {
    case "payment_intent.succeeded":
        handlePaymentSucceeded(event)
    case "payment_intent.payment_failed":
        handlePaymentFailed(event)
    case "charge.refunded":
        handleRefund(event)
    case "charge.dispute.created":
        handleDispute(event)
    default:
        log.Printf("Unhandled event type: %s", event.Type)
    }

    c.JSON(200, gin.H{"received": true})
}

func handlePaymentSucceeded(event stripe.Event) {
    var paymentIntent stripe.PaymentIntent
    if err := json.Unmarshal(event.Data.Payload, &paymentIntent); err != nil {
        log.Printf("Failed to unmarshal payment intent: %v", err)
        return
    }

    // Extract order ID from metadata
    orderID := paymentIntent.Metadata["order_id"]
    userID := paymentIntent.Metadata["user_id"]

    // Update order status in database
    // ... database update logic ...

    log.Printf("Payment succeeded: %s for order %s", paymentIntent.ID, orderID)
}

func handlePaymentFailed(event stripe.Event) {
    var paymentIntent stripe.PaymentIntent
    if err := json.Unmarshal(event.Data.Payload, &paymentIntent); err != nil {
        log.Printf("Failed to unmarshal payment intent: %v", err)
        return
    }

    orderID := paymentIntent.Metadata["order_id"]

    // Notify user of payment failure
    // ... notification logic ...

    log.Printf("Payment failed: %s for order %s", paymentIntent.ID, orderID)
}
```

## Frontend Integration

### Flutter Rider App

Install Stripe SDK:

```bash
cd user_mobile_app_rider_flutter
flutter pub add flutter_stripe
flutter pub add stripe_android
```

Configure Stripe:

```dart
// lib/config/stripe_config.dart
class StripeConfig {
  static const String publishableKey =
      kDebugMode ? 'pk_test_YOUR_KEY' : 'pk_live_YOUR_KEY';
  static const String merchantId = 'merchant.com.yourcompany';
  
  static const String currency = 'usd';
  static const String stripeAccount = 'acct_YOUR_ACCOUNT_ID';
}
```

Create Payment Flow:

```dart
// lib/services/payment_service.dart
import 'package:flutter_stripe/flutter_stripe.dart';

class PaymentService {
  Future<void> initialize() async {
    await Stripe.instance.applySettings(
      const StripePublishableKey(StripeConfig.publishableKey),
      stripeAccountId: StripeConfig.stripeAccount,
      merchantIdentifier: StripeConfig.merchantId,
    );
  }

  Future<PaymentIntent> createPaymentIntent({
    required String orderId,
    required double amount,
    required String currency,
    required String customerId,
  }) async {
    // Call backend to create payment intent
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/v1/payment/intent'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'orderId': orderId,
        'amount': amount,
        'currency': currency,
        'customerId': customerId,
      }),
    );

    final data = jsonDecode(response.body);
    return PaymentIntent(
      clientSecret: data['clientSecret'],
      paymentId: data['paymentId'],
    );
  }

  Future<void> confirmPayment({
    required String paymentIntentId,
    required String paymentMethodId,
  }) async {
    await Stripe.instance.confirmPayment(
      paymentIntentId,
      const PaymentMethodParams.card(
        paymentMethodId: PaymentMethodId,
      ),
    );
  }
}

Future<PaymentSheet> presentPaymentSheet({
  required String clientSecret,
  required double amount,
}) async {
  final result = await Stripe.instance.presentPaymentSheet(
    paymentIntentClientSecret: clientSecret,
    params: const PaymentSheetParams(
      googlePay: const PaymentSheetGooglePay(
        testEnv: true,
        merchantCountryCode: 'US',
        currencyCode: 'USD',
      ),
      applePay: const PaymentSheetApplePay(
        merchantCountryCode: 'US',
        cartItems: [
          PaymentSheetApplePayCartItem(
            label: 'Trip Fare',
            amount: amount,
          ),
        ],
      ),
    ),
  );

  return result;
}
```

### React Web Interface

Install Stripe SDK:

```bash
cd web_interface_react
npm install @stripe/stripe-js @stripe/react-stripe-js
```

Create Payment Component:

```typescript
// src/components/PaymentSheet.tsx
import { loadStripe, StripeElements, PaymentElement, CardElement } from '@stripe/stripe-js';
import { ElementsConsumer, CardElement, useStripe, useElements, } from '@stripe/react-stripe-js';
import { useState } from 'react';

const PaymentSheet: React.FC<{ 
  orderId: string;
  amount: number;
  onSuccess: () => void;
}> = ({ orderId, amount, onSuccess }) => {
  const { stripe } = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProcessing(true);

    if (!stripe || !elements) {
      return;
    }

    // Create payment intent
    const { clientSecret } = await fetch('/api/v1/payment/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, amount }),
    }).then((r) => r.json());

    // Confirm payment
    const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: 'John Doe',
          },
        },
      }
    );

    if (confirmError) {
      setError(confirmError.message);
      setProcessing(false);
      return;
    }

    onSuccess();
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={!stripe || processing}>
        {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
};

export default PaymentSheet;
```

## Subscription Billing

### Create Product

```bash
# 1. Navigate to Products
# 2. Add product: Tripo04OS Premium Monthly
#    - Price: $9.99/month
# 3. Add product: Tripo04OS Premium Annual
#    - Price: $99.99/year
```

### Create Price

```go
import (
    "github.com/stripe/stripe-go/v74/price"
)

func CreateMonthlySubscriptionPrice() (*stripe.Price, error) {
    params := &stripe.PriceParams{
        Currency:   stripe.String("usd"),
        UnitAmount: stripe.Int64(999),  // $9.99
        Recurring: &stripe.PriceRecurringParams{
            Interval: stripe.String("month"),
        },
        ProductData: &stripe.PriceProductDataParams{
            Name: "Tripo04OS Premium Monthly",
        },
    }

    return stripe.GetClient().Prices.New(params)
}

func CreateAnnualSubscriptionPrice() (*stripe.Price, error) {
    params := &stripe.PriceParams{
        Currency:   stripe.String("usd"),
        UnitAmount: stripe.Int64(9999),  // $99.99
        Recurring: &stripe.PriceRecurringParams{
            Interval: stripe.String("year"),
        },
        ProductData: &stripe.PriceProductDataParams{
            Name: "Tripo04OS Premium Annual",
        },
    }

    return stripe.GetClient().Prices.New(params)
}
```

### Create Subscription

```go
type CreateSubscriptionRequest struct {
    CustomerID string `json:"customerId" binding:"required"`
    PriceID    string `json:"priceId" binding:"required"`
    TrialDays  int    `json:"trialDays"`
}

type CreateSubscriptionResponse struct {
    Success      bool   `json:"success"`
    SubscriptionID string `json:"subscriptionId"`
    ClientSecret string `json:"clientSecret"`
}

func CreateSubscription(c *gin.Context) {
    var req CreateSubscriptionRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }

    // Create subscription
    params := &stripe.SubscriptionParams{
        Customer: stripe.String(req.CustomerID),
        Items: []*stripe.SubscriptionItemsParams{
            {
                Price:    stripe.String(req.PriceID),
                Quantity: stripe.Int64(1),
            },
        },
        PaymentBehavior: stripe.String("default_incomplete"),
        TrialPeriodDays: stripe.Int64(req.TrialDays),
    }

    subscription, err := stripe.GetClient().Subscriptions.New(params)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }

    // Get latest invoice
    invoice, err := stripe.GetClient().Invoices.Get(subscription.LatestInvoice.ID, nil)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }

    c.JSON(200, CreateSubscriptionResponse{
        Success:      true,
        SubscriptionID: subscription.ID,
        ClientSecret: invoice.PaymentIntent.ClientSecret,
    })
}
```

## Driver Payouts (Connect)

### Connect Onboarding

Create `backend_services/payout_service/handlers/connect.go`:

```go
package handlers

import (
    "github.com/appleboy/gin"
    "github.com/stripe/stripe-go/v74/account"
    "github.com/stripe/stripe-go/v74/connect"
    stripe "github.com/stripe/stripe-go/v74/connect/onboarding"
)

type CreateConnectAccountRequest struct {
    Email       string `json:"email" binding:"required,email"`
    Country     string `json:"country" binding:"required"`
    BusinessType string `json:"businessType"` // individual, company
}

type CreateConnectAccountResponse struct {
    Success      bool   `json:"success"`
    AccountID    string `json:"accountId"`
    OnboardingURL string `json:"onboardingUrl"`
}

func CreateConnectAccount(c *gin.Context) {
    var req CreateConnectAccountRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }

    // Create Connect account
    params := &stripe.AccountParams{
        Country:   stripe.String(req.Country),
        Type:      stripe.String(req.BusinessType),
        BusinessProfile: &stripe.AccountBusinessProfileParams{
            TosAcceptance: stripe.Bool(true),
            Url:          stripe.String("https://tripo04os.com/terms"),
        },
        Capabilities: &stripe.AccountCapabilitiesParams{
            Transfers: &stripe.AccountCapabilitiesTransfersParams{Requested: true},
            CardPayments: &stripe.AccountCapabilitiesCardPaymentsParams{Requested: true},
        },
    }

    account, err := stripe.GetClient().Accounts.New(params)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }

    // Create onboarding link
    onboardingParams := &stripe.AccountLinkOnboardingParams{
        Account: account.ID,
        RefreshToken: stripe.String("refresh_token_here"),
        ReturnURL:       stripe.String("https://driver.tripo04os.com/connect/complete"),
        Type:           stripe.String("account_onboarding"),
    }

    accountLink, err := stripe.GetClient().AccountLinks.New(onboardingParams)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }

    c.JSON(200, CreateConnectAccountResponse{
        Success:      true,
        AccountID:    account.ID,
        OnboardingURL: accountLink.URL,
    })
}
```

### Create Transfer

```go
type CreateTransferRequest struct {
    AccountID  string  `json:"accountId" binding:"required"`
    Amount      float64 `json:"amount" binding:"required,min=1.00"`
    Currency    string  `json:"currency"`
    Description string  `json:"description"`
}

func CreateTransfer(c *gin.Context) {
    var req CreateTransferRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }

    // Convert amount to cents
    amount := int64(req.Amount * 100)
    if req.Currency == "" {
        req.Currency = "usd"
    }

    params := &stripe.TransferParams{
        Amount:      stripe.Int64(amount),
        Currency:    stripe.String(req.Currency),
        Destination: stripe.String(req.AccountID),
        Description: stripe.String(req.Description),
        Metadata: map[string]string{
            "driver_id": c.GetString("user_id"),
            "payout_id": c.GetString("payout_id"),
        },
    }

    transfer, err := stripe.GetClient().Transfers.New(params)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }

    c.JSON(200, gin.H{
        "success":   true,
        "transferId": transfer.ID,
        "amount":     transfer.Amount,
        "currency":   transfer.Currency,
    })
}
```

## Environment Configuration

### Backend (.env)

```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
STRIPE_CURRENCY=usd
STRIPE_SUCCESS_URL=https://web.tripo04os.com/payment/success
STRIPE_CANCEL_URL=https://web.tripo04os.com/payment/cancel
STRIPE_CONNECT_PLATFORM_ID=acct_YOUR_PLATFORM_ID
```

### Flutter (.env)

```env
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
STRIPE_MERCHANT_ID=merchant.com.yourcompany
```

### React (.env)

```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
REACT_APP_STRIPE_MERCHANT_ID=merchant.com.yourcompany
```

## Testing

### Test Cards

Use Stripe test cards for testing:

```
Visa: 42424242424242424 (Success)
Visa (Declined): 4000000000000002
Visa (Insufficient Funds): 4000000000009995
American Express: 378282246310005
Mastercard: 5555555555554444
```

### Test Webhooks

```bash
# Test webhook endpoint
stripe trigger payment_intent.succeeded \
  --add payment_intent:pi_3MsTwPvVtV3U2 \
  --add api_key:sk_test_YOUR_KEY
```

## Troubleshooting

### Payment Intent Creation Failed

```bash
# Check Stripe API key
curl https://api.stripe.com/v1/charges \
  -u sk_test_YOUR_KEY:
```

### Webhook Not Received

```bash
# Check webhook endpoint
curl -X POST https://api.tripo04os.com/v1/payment/webhook \
  -H "Stripe-Signature: t=..."
  -H "Content-Type: application/json" \
  -d '{...}'
```

### Subscription Not Created

```bash
# Check product exists
stripe products retrieve prod_YOUR_PRODUCT_ID \
  --api-key sk_test_YOUR_KEY
```

## Best Practices

1. **Never Store Secret Keys in Client Code**
   - Only use publishable keys in client
   - Keep secret keys in backend environment variables

2. **Always Use Payment Intents**
   - More secure than direct charges
   - Support 3D Secure
   - Better UX with dynamic authentication

3. **Implement Webhook Security**
   - Verify all webhook signatures
   - Use HTTPS endpoints
   - Handle idempotency keys

4. **Handle Errors Gracefully**
   - Provide clear error messages
   - Log all errors for debugging
   - Implement retry logic for temporary failures

5. **Monitor Payment Metrics**
   - Track success rates
   - Monitor webhook delivery
   - Set up alerts for failed payments

6. **Regularly Rotate Keys**
   - Rotate API keys every 90 days
   - Update webhook secrets
   - Test after rotation

## Next Steps

1. **Enable Production Mode**
   - Update keys to live versions
   - Test with real payment methods
   - Enable additional payment methods

2. **Set Up Fraud Prevention**
   - Configure Radar for fraud detection
   - Set up email notifications for disputes
   - Implement chargeback management

3. **Configure Payout Schedule**
   - Set up automatic payouts for drivers
   - Configure payout timing (daily, weekly, monthly)
   - Set up payout notifications

## Support

For Stripe integration issues:
- Stripe Documentation: https://stripe.com/docs
- Stripe Dashboard: https://dashboard.stripe.com/
- Stripe Support: https://support.stripe.com/

## License

Proprietary - Tripo04OS Internal Use Only

---

**End of Stripe Payment Integration Guide**
