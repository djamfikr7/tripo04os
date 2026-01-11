# Support Team Training Manual

**Version:** 1.0  
**Last Updated:** 2026-01-11  
**Target Audience:** Support Team (Level 1, Level 2, Level 3)

---

## Table of Contents

### 1. Platform Overview
### 2. Common Issues & Troubleshooting
### 3. Tools & Systems
### 4. Escalation Procedures
### 5. Communication Guidelines
### 6. Service-Level Agreements
### 7. Knowledge Base

---

## 1. Platform Overview

### What is Tripo04OS?

Tripo04OS is a multi-service transportation platform offering:
- **RIDE** - Standard and premium ride-hailing
- **MOTO** - Motorcycle and scooter services
- **FOOD** - Food delivery
- **GROCERY** - Grocery delivery
- **GOODS** - Package and goods delivery
- **TRUCK_VAN** - Truck and van transportation

### Platform Components

| Component | Description | Support Relevance |
|----------|-------------|-------------------|
| Rider App | User-facing mobile app | User registration, ride booking, payments |
| Driver App | Driver-facing mobile app | Driver registration, trip acceptance, earnings |
| Admin Dashboard | Internal admin panel | User management, dispute resolution |
| Web Interface | Rider web portal | Account management, order history |

### User Types

| Type | Description | Issues |
|------|-------------|--------|
| **Rider** | Requests transportation | Booking, payments, account issues |
| **Driver** | Provides transportation | Earnings, trips, account issues |
| **Corporate Client** | Business account | Invoicing, management, billing |
| **Partner** | Restaurant, store, fleet | Order management, payouts |

---

## 2. Common Issues & Troubleshooting

### Category A: Rider Issues

#### Issue 1: Can't Book a Ride

**Symptoms:**
- Rider unable to create order
- App shows "No drivers available"
- Booking button unresponsive

**Diagnosis:**
1. Check rider's location services (GPS enabled)
2. Verify rider's account is active (not suspended)
3. Check if rider has valid payment method
4. Check if driver availability in rider's area

**Troubleshooting Steps:**

**Step 1: Verify Rider Status**
```bash
# Check if rider account is active
SELECT status, suspension_reason FROM users WHERE id = <rider_id>;

# Expected: status = 'active'
# If suspended, check suspension_reason
```

**Step 2: Check Payment Method**
```bash
# Check if rider has valid payment method
SELECT * FROM payment_methods 
WHERE user_id = <rider_id> AND is_active = true;
```

**Step 3: Check Driver Availability**
```bash
# Check available drivers in rider's area
SELECT COUNT(*) FROM drivers 
WHERE status = 'available' 
  AND last_location_updated_at > NOW() - INTERVAL '5 minutes'
  AND ST_DWithin(location, ST_MakePoint(<lat>, <lng>), 5000);
```

**Resolution:**
- **No GPS**: Guide rider to enable location services
- **Account Suspended**: Explain reason, direct to terms of service
- **No Payment Method**: Guide rider to add payment method
- **No Drivers**: Suggest different time/location, notify demand team

**Time to Resolve:** 5-10 minutes

---

#### Issue 2: Ride Taking Too Long

**Symptoms:**
- Driver not assigned after > 5 minutes
- Driver status not updating
- ETA not decreasing

**Diagnosis:**
1. Check order status (matching, driver assigned, en route)
2. Check matching service logs for errors
3. Check driver's location updates
4. Check ETA calculation

**Troubleshooting Steps:**

**Step 1: Check Order Status**
```bash
# Check current order status
SELECT status, driver_id, created_at, updated_at 
FROM orders 
WHERE id = <order_id>;
```

**Step 2: Check Matching Logs**
```bash
# Check matching service logs
kubectl logs -f deployment/matching-service | grep <order_id>
```

**Step 3: Check Driver Location**
```bash
# Check driver's last location update
SELECT * FROM locations 
WHERE driver_id = <driver_id> 
ORDER BY created_at DESC LIMIT 1;
```

**Step 4: Recalculate ETA**
```bash
# Force ETA recalculation
curl -X POST http://matching-service/api/matching/recalculate-eta \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"order_id": "<order_id>"}'
```

**Resolution:**
- **Stuck in Matching**: Cancel order, suggest retry
- **Driver Not Moving**: Contact driver via communication service
- **ETA Wrong**: Recalculate ETA, update rider
- **Driver Cancelled**: Auto-assign new driver

**Time to Resolve:** 10-15 minutes

---

#### Issue 3: Payment Failed

**Symptoms:**
- Rider charged but order not confirmed
- Rider payment method declined
- Rider double charged

**Diagnosis:**
1. Check payment transaction status
2. Check order payment status
3. Check Stripe payment logs
4. Verify refund status (if applicable)

**Troubleshooting Steps:**

**Step 1: Check Payment Transaction**
```bash
# Check payment transaction in database
SELECT * FROM payment_transactions 
WHERE order_id = <order_id> 
ORDER BY created_at DESC LIMIT 1;
```

**Step 2: Check Stripe Logs**
```bash
# Check Stripe payment intent
stripe payment_intents retrieve <payment_intent_id>
```

**Step 3: Check Order Payment Status**
```bash
# Check if order is marked as paid
SELECT payment_status, payment_id FROM orders WHERE id = <order_id>;
```

**Resolution:**
- **Payment Declined**: Explain to rider, suggest retry with different payment method
- **Double Charged**: Initiate refund (Stripe dashboard or API)
- **Charged but Order Not Confirmed**: Contact engineering team, escalate

**Time to Resolve:** 10-30 minutes (refunds take longer)

---

### Category B: Driver Issues

#### Issue 4: Can't Accept Ride

**Symptoms:**
- Driver unable to accept ride
- App shows "No rides available"
- Accept button unresponsive

**Diagnosis:**
1. Check driver's account status (active, suspended, verified)
2. Check driver's vehicle status
3. Check if driver is in required location area
4. Check driver's balance (if negative)

**Troubleshooting Steps:**

**Step 1: Verify Driver Status**
```bash
# Check if driver account is active
SELECT status, verification_status, balance FROM drivers WHERE id = <driver_id>;

# Expected: status = 'active', verification_status = 'verified'
```

**Step 2: Check Vehicle Status**
```bash
# Check if vehicle is approved
SELECT status, inspection_date FROM vehicles WHERE driver_id = <driver_id>;

# Expected: status = 'approved', inspection_date < 1 year ago
```

**Step 3: Check Driver Location**
```bash
# Check driver's last location
SELECT * FROM locations 
WHERE driver_id = <driver_id> 
ORDER BY created_at DESC LIMIT 1;
```

**Resolution:**
- **Account Suspended**: Explain reason, direct to driver portal
- **Vehicle Expired**: Guide driver to schedule vehicle inspection
- **Wrong Location**: Guide driver to move to requested pickup area
- **Negative Balance**: Explain earnings deduction, direct to payment details

**Time to Resolve:** 5-10 minutes

---

#### Issue 5: Earnings Not Showing

**Symptoms:**
- Driver earnings not updated after trip
- Trip not showing in earnings history
- Payout not received

**Diagnosis:**
1. Check trip status (completed)
2. Check trip earnings calculation
3. Check payout status
4. Check driver's payout configuration

**Troubleshooting Steps:**

**Step 1: Check Trip Status**
```bash
# Check if trip is completed
SELECT status, completed_at, fare FROM trips WHERE id = <trip_id>;

# Expected: status = 'completed'
```

**Step 2: Check Earnings Calculation**
```bash
# Check trip earnings breakdown
SELECT * FROM trip_earnings WHERE trip_id = <trip_id>;

# Should show: fare, commission, driver_earnings
```

**Step 3: Check Payout Status**
```bash
# Check if payout is processed
SELECT * FROM payouts WHERE driver_id = <driver_id> 
ORDER BY created_at DESC LIMIT 1;
```

**Resolution:**
- **Trip Not Completed**: Wait for trip completion, inform driver
- **Earnings Calculated Wrong**: Contact finance team, adjust earnings
- **Payout Pending**: Explain payout schedule (weekly/bi-weekly)
- **Payout Failed**: Check payment method, verify bank details

**Time to Resolve:** 15-30 minutes

---

### Category C: Account & Authentication

#### Issue 6: Can't Login

**Symptoms:**
- User unable to log in
- "Invalid credentials" error
- "Account locked" error

**Diagnosis:**
1. Check if user exists in database
2. Check if account is locked (too many failed attempts)
3. Check if account is suspended
4. Check if email is verified

**Troubleshooting Steps:**

**Step 1: Verify User Exists**
```bash
# Check if user exists
SELECT id, email, status FROM users WHERE email = <user_email>;
```

**Step 2: Check Account Lock Status**
```bash
# Check if account is locked
SELECT is_locked, locked_at, failed_attempts FROM user_security 
WHERE user_id = <user_id>;
```

**Step 3: Reset Password (if needed)**
```bash
# Initiate password reset
curl -X POST http://identity-service/api/auth/reset-password \
  -d '{"email": "<user_email>"}'
```

**Resolution:**
- **User Not Found**: Guide user to register new account
- **Account Locked**: Explain lock reason, guide to password reset
- **Account Suspended**: Explain suspension, direct to terms of service
- **Email Not Verified**: Resend verification email

**Time to Resolve:** 5-10 minutes

---

#### Issue 7: Email Not Verified

**Symptoms:**
- User doesn't receive verification email
- Verification link expired
- Verification code doesn't work

**Diagnosis:**
1. Check if verification email was sent
2. Check if email is in spam/junk folder
3. Check if verification code/token is expired
4. Check email service status (SendGrid)

**Troubleshooting Steps:**

**Step 1: Check Email Logs**
```bash
# Check if email was sent
SELECT * FROM email_logs 
WHERE user_id = <user_id> AND type = 'verification'
ORDER BY created_at DESC LIMIT 1;
```

**Step 2: Resend Verification Email**
```bash
# Resend verification email
curl -X POST http://identity-service/api/auth/resend-verification \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"user_id": "<user_id>"}'
```

**Resolution:**
- **Email Not Sent**: Resend verification email
- **Email in Spam**: Guide user to check spam/junk folders
- **Link Expired**: Send new verification email
- **Email Service Down**: Contact engineering team, escalate

**Time to Resolve:** 5-10 minutes

---

### Category D: Technical Issues

#### Issue 8: App Crashing

**Symptoms:**
- App crashes on launch
- App crashes during specific action
- App freezes/unresponsive

**Diagnosis:**
1. Check app version (is user on latest version?)
2. Check device compatibility (OS version, model)
3. Check crash logs (from backend)
4. Check for known app issues in release notes

**Troubleshooting Steps:**

**Step 1: Check App Version**
```bash
# Ask user for app version (Settings → About)
# Check if update is available
```

**Step 2: Check Device Compatibility**
```bash
# Ask user for device model and OS version
# Verify device is supported
```

**Step 3: Check Crash Logs**
```bash
# Check backend for crash logs
kubectl logs -l app=<app_name> --tail=100 | grep "crash"
```

**Resolution:**
- **Old App Version**: Guide user to update app
- **Device Not Supported**: Explain minimum requirements
- **Known Bug**: Check release notes, inform user of fix timeline
- **New Issue**: Collect crash logs, file bug report

**Time to Resolve:** 10-20 minutes

---

#### Issue 9: Slow App Performance

**Symptoms:**
- App is slow to load
- App is unresponsive to taps/swipes
- Long loading times for screens

**Diagnosis:**
1. Check device performance (old/slow device)
2. Check network connection (slow internet)
3. Check server performance (latency, response time)
4. Check if app cache needs clearing

**Troubleshooting Steps:**

**Step 1: Check Network Connection**
```bash
# Ask user to check internet speed
# Guide user to use Wi-Fi instead of cellular (if applicable)
```

**Step 2: Check Server Performance**
```bash
# Check if servers are responding normally
curl -w "@curl-format.txt" http://api-gateway.tripo04os.com/health

# Check response time (should be < 500ms)
```

**Step 3: Clear App Cache**
```bash
# Guide user to clear app cache
# Android: Settings → Apps → Tripo04OS → Clear Cache
# iOS: Settings → General → iPhone Storage → Offload App
```

**Resolution:**
- **Slow Internet**: Guide user to check connection, try different network
- **Server Issue**: Check status page, escalate to engineering team
- **Device Issue**: Suggest device restart, or use different device
- **App Cache Issue**: Guide user to clear cache, restart app

**Time to Resolve:** 5-15 minutes

---

## 3. Tools & Systems

### Admin Dashboard

**URL:** https://admin.tripo04os.com  
**Access:** VPN + LDAP authentication

**Key Features:**
- User management (search, view, suspend, unsuspend)
- Order management (view, cancel, refund)
- Driver management (view, suspend, verify)
- Payout management (view, initiate)
- Dispute management (view, resolve)

**Common Tasks:**

| Task | Steps |
|------|--------|
| **View User Profile** | Users → Search (email/phone) → View Details |
| **Suspend User** | Users → Search → Actions → Suspend → Select Reason → Confirm |
| **Unsuspend User** | Users → Search → Actions → Unsuspend → Confirm |
| **View Order** | Orders → Search (order ID) → View Details |
| **Cancel Order** | Orders → Search → Actions → Cancel → Select Reason → Confirm |
| **Refund Payment** | Orders → Search → Payment → Refund → Select Amount → Confirm |

---

### Customer Support Portal

**URL:** https://support.tripo04os.com  
**Access:** Ticket system (Zendesk)

**Key Features:**
- Ticket creation and management
- Customer communication
- Knowledge base
- Reporting and analytics

**Ticket Categories:**
1. **Rider Support** - Rider account, booking, payment issues
2. **Driver Support** - Driver account, earnings, vehicle issues
3. **Technical Support** - App crashes, performance issues
4. **Billing Support** - Invoicing, refunds, disputes
5. **Safety Support** - Emergency incidents, accidents, harassment

---

### Monitoring Tools

**Grafana:** https://grafana.tripo04os.com  
**Purpose:** Real-time metrics and dashboards

**Key Dashboards:**
- Service Overview - Overall platform health
- API Performance - Response times, error rates
- Business Metrics - Orders, users, revenue
- Incident Response - Active incidents

**Prometheus:** https://prometheus.tripo04os.com  
**Purpose:** Metrics query and alert management

**Jaeger:** https://jaeger.tripo04os.com  
**Purpose:** Distributed tracing (debug slow requests)

---

### Communication Tools

**Slack:** #support, #support-escalations, #platform-alerts  
**PagerDuty:** On-call rotation (Level 1, Level 2, Level 3)  
**Email:** support@tripo04os.com, escalations@tripo04os.com

**Usage Guidelines:**
- **Slack**: Team communication, handoffs, updates
- **PagerDuty**: Critical incidents only (immediate response required)
- **Email**: Non-urgent communication, follow-ups

---

## 4. Escalation Procedures

### Escalation Matrix

| Issue Type | Level 1 | Level 2 | Level 3 |
|-----------|----------|----------|----------|
| **Rider Booking Issues** | < 10 min | 10-30 min | > 30 min |
| **Driver Issues** | < 15 min | 15-45 min | > 45 min |
| **Payment Issues** | < 15 min | 15-30 min | > 30 min |
| **Technical Issues** | < 20 min | 20-60 min | > 60 min |
| **Safety Incidents** | < 5 min | 5-15 min | > 15 min |

### Level 1 (Tier 1)

**Staff:** Customer Support Representatives  
**Scope:**
- Basic account issues
- Common booking issues
- Payment inquiries (non-disputed)
- Technical troubleshooting (common issues)

**Time to Resolve:** < 15 minutes  
**SLA:** 90% resolved in Level 1

### Level 2 (Tier 2)

**Staff:** Senior Support Representatives / Team Leads  
**Scope:**
- Complex account issues
- Escalated booking issues
- Disputed payments
- Technical troubleshooting (complex issues)
- Driver earnings disputes

**Time to Resolve:** < 45 minutes  
**SLA:** 90% resolved in Level 2

### Level 3 (Tier 3)

**Staff:** Support Managers / Engineering Team  
**Scope:**
- Critical platform issues
- Service outages
- Security incidents
- Data loss/corruption
- Regulatory compliance issues

**Time to Resolve:** < 4 hours  
**SLA:** 95% resolved in Level 3

### Escalation Process

**Step 1: Attempt Resolution (Level 1)**
- Attempt to resolve issue within Level 1 timeframe
- Document all troubleshooting steps
- Collect relevant screenshots/logs

**Step 2: Escalate to Level 2**
- If Level 1 cannot resolve within timeframe
- Transfer to Level 2 with full context
- Notify Level 2 via Slack (#support-escalations)

**Step 3: Escalate to Level 3**
- If Level 2 cannot resolve within timeframe
- Contact on-call engineering team (PagerDuty)
- Create critical incident ticket
- Notify all stakeholders

**Step 4: Post-Incident Review**
- After resolution, document root cause
- Update knowledge base
- Train Level 1/2 team on new issue

---

## 5. Communication Guidelines

### Tone and Style

**Principles:**
- **Empathetic**: Acknowledge user's frustration
- **Professional**: Maintain professional demeanor
- **Clear**: Use simple, jargon-free language
- **Action-Oriented**: Focus on next steps and solutions

**Do:**
- Use user's name (if available)
- Acknowledge their issue
- Explain what you're doing to help
- Provide clear next steps
- Set expectations for resolution time

**Don't:**
- Use technical jargon
- Blame the user or platform
- Promise what you can't deliver
- Transfer without explanation
- End conversation abruptly

### Script Examples

#### Greeting
> "Hello! Thanks for contacting Tripo04OS support. My name is [Your Name]. I understand you're experiencing [user's issue]. I'm here to help you today."

#### Empathy
> "I understand how frustrating it is when [specific issue]. Let me look into this for you right away."

#### Status Update
> "I'm still investigating this issue. I want to make sure I find the right solution for you. This should take another [X] minutes. Thank you for your patience."

#### Resolution
> "Great news! I've resolved this issue. [Explain what was fixed]. Is there anything else I can help you with today?"

#### Escalation
> "I need to escalate this to our technical team to resolve it fully. I'll transfer you to a specialist who can help further. Here's the reference number for this issue: [Ticket ID]."

#### Closing
> "I'm glad I could help you today. If you experience any further issues, please don't hesitate to reach out. Have a great day!"

---

## 6. Service-Level Agreements

### Response Time SLAs

| Issue Type | Initial Response | Resolution |
|-----------|----------------|------------|
| **Rider - Booking Issues** | 2 minutes | 10 minutes |
| **Rider - Payment Issues** | 2 minutes | 15 minutes |
| **Rider - Account Issues** | 5 minutes | 10 minutes |
| **Driver - Earnings Issues** | 5 minutes | 20 minutes |
| **Driver - Vehicle Issues** | 5 minutes | 15 minutes |
| **Driver - Account Issues** | 5 minutes | 10 minutes |
| **Technical - App Issues** | 3 minutes | 20 minutes |
| **Safety - Emergency** | 1 minute | 5 minutes |

### Resolution SLAs

| Issue Priority | Target Resolution | SLA Compliance |
|--------------|------------------|-----------------|
| **Critical** (Safety, Outage) | < 15 minutes | 95% |
| **High** (Payments, Booking) | < 30 minutes | 90% |
| **Medium** (Account, Earnings) | < 60 minutes | 85% |
| **Low** (General inquiries) | < 24 hours | 80% |

### Customer Satisfaction (CSAT)

**Target:** 90% CSAT score ≥ 4/5

**Measurement:**
- Sent after ticket closure via email
- Questions:
  1. Was your issue resolved?
  2. How satisfied are you with the support you received? (1-5)
  3. How would you rate the overall support experience? (1-5)

---

## 7. Knowledge Base

### Common FAQs

#### Rider FAQs

**Q: How do I cancel a ride?**  
A: Open the app, go to active ride, tap "Cancel ride", select reason, confirm.

**Q: How do I get a receipt?**  
A: Go to "My Trips", select trip, tap "Receipt", send to email.

**Q: I left something in the car. What do I do?**  
A: Go to "My Trips", select trip, tap "Lost Item", submit details. We'll contact the driver.

#### Driver FAQs

**Q: When do I get paid?**  
A: Payouts are processed weekly on [Day of week]. Earnings from [Monday] to [Sunday] are paid on [Day].

**Q: How do I report a trip issue?**  
A: Go to "My Trips", select trip, tap "Report Issue", select issue type, submit details.

**Q: My vehicle status shows "Expired". What do I do?**  
A: Schedule a vehicle inspection at [URL]. Upload inspection documents via Driver Portal.

#### Payment FAQs

**Q: How do I update my payment method?**  
A: Go to "Payment" in app, tap "Add Payment Method", enter details, confirm.

**Q: I was charged but didn't get a ride. What do I do?**  
A: Contact support with order ID. We'll investigate and refund if applicable.

### Known Issues

| Issue | Status | Workaround | ETA |
|-------|--------|------------|-----|
| iOS App crashes on iPhone 13 | Known, investigating | Restart app | 2 days |
| Payment via Apple Pay fails 10% of time | Known, working with Apple | Use credit card | 1 week |
| Driver app shows wrong ETA | Known, fixing in next release | Use web portal | 3 days |

---

## Training Assessment

### Quiz Questions

1. **Rider can't book a ride. What's the first thing you check?**  
   A. Rider's payment method  
   B. Rider's account status  
   C. Driver availability  
   D. Rider's location services  

2. **A driver reports earnings not showing. What do you do?**  
   A. Check trip status  
   B. Check driver's balance  
   C. Resend payout  
   D. Check vehicle status  

3. **A user can't log in and sees "Account locked". What's the issue?**  
   A. Too many failed login attempts  
   B. Account suspended  
   C. Email not verified  
   D. Payment method invalid  

4. **What's the SLA for critical safety incidents?**  
   A. < 5 minutes  
   B. < 15 minutes  
   C. < 30 minutes  
   D. < 60 minutes  

5. **A payment failed but user was charged. What's the resolution?**  
   A. Tell user to wait  
   B. Contact engineering team  
   C. Refund payment immediately  
   D. Ask user to try again  

**Answers:**  
1. B (Check rider's account status first)  
2. A (Check trip status - earnings only show after trip completes)  
3. A (Account locked = too many failed attempts)  
4. B (< 15 minutes for critical incidents)  
5. B (Payment failed but charged = payment service issue, contact engineering)

---

## Appendix

### A. Contact Directory

| Team | Email | Slack | Phone |
|------|-------|-------|-------|
| Support Team | support@tripo04os.com | #support | +1-XXX-XXX-XXXX |
| Escalations | escalations@tripo04os.com | #support-escalations | +1-XXX-XXX-XXXX |
| Engineering | engineering@tripo04os.com | #platform | +1-XXX-XXX-XXXX |
| Finance | finance@tripo04os.com | #finance | +1-XXX-XXX-XXXX |
| Safety | safety@tripo04os.com | #safety | +1-XXX-XXX-XXXX |
| On-Call SRE | oncall@tripo04os.com | PagerDuty | +1-XXX-XXX-XXXX |

### B. Quick Reference Commands

```bash
# Check user status
SELECT status FROM users WHERE email = '<user_email>';

# Check order status
SELECT status, driver_id FROM orders WHERE id = '<order_id>';

# Check driver status
SELECT status, balance FROM drivers WHERE id = '<driver_id>';

# Check trip earnings
SELECT * FROM trip_earnings WHERE trip_id = '<trip_id>';

# Cancel order (admin)
curl -X POST http://admin.tripo04os.com/api/orders/<order_id>/cancel \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"reason": "customer_request"}';

# Refund payment (admin)
curl -X POST http://admin.tripo04os.com/api/payments/<payment_id>/refund \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"amount": <amount>, "reason": "<reason>"}';
```

### C. Glossary

| Term | Definition |
|-------|------------|
| **Tier 1** | Level 1 support (basic issues) |
| **Tier 2** | Level 2 support (complex issues) |
| **Tier 3** | Level 3 support (critical issues, engineering) |
| **SLA** | Service Level Agreement |
| **CSAT** | Customer Satisfaction score |
| **ETA** | Estimated Time of Arrival |
| **RPS** | Requests Per Second |

---

**Last Updated:** 2026-01-11  
**Next Training Review:** 2026-04-11 (Quarterly)
