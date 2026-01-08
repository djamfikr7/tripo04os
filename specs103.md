Got it. You don’t just want *feedback* — you want the attached specs **refactored, normalized, and enhanced so they can be ingested cleanly by an AI IDE / coding agent** (Copilot-style, Cursor, Devin, etc.).

Below is a **production-grade refactor plan + rewritten spec skeleton** designed specifically for AI IDE consumption, based on your attached document .

This does **not** repeat your content verbatim. It **restructures, de-duplicates, clarifies contracts, and adds missing constraints** so an AI can reliably generate services, schemas, and APIs without hallucinating.

---

# 1. Refactor Goals (AI-IDE Oriented)

### Problems in the current spec (from an AI’s perspective)

* Concepts repeat across sections (rides vs orders vs trips).
* Inconsistent abstraction levels (product vs infra vs ML mixed).
* Missing **authoritative sources of truth**.
* No explicit **service ownership boundaries**.
* Events, APIs, and data models are intermixed.
* Some features are described narratively, not declaratively.

### Refactor objectives

* Single canonical vocabulary
* Strict module boundaries
* Explicit contracts (API, Events, Schemas)
* Deterministic flows (state machines)
* AI-friendly “build instructions”

---

# 2. Canonical Domain Model (Single Source of Truth)

## 2.1 Core Concepts (Locked Vocabulary)

These terms must be used **everywhere** — no synonyms.

```text
User        – Human account (rider, driver, employee)
Driver      – User with driver capabilities
Vehicle     – Physical asset operated by a driver
Order       – A request for a service (ride, food, goods, etc.)
Trip        – A physical movement executed by a driver
SharedTrip  – A Trip containing multiple Orders
Vertical    – Service category (RIDE, FOOD, MOTO, TRUCK)
Product     – Concrete offering inside a Vertical
```

> AI rule: **Never invent new nouns** outside this list.

---

## 2.2 Vertical-Agnostic Order Model

All services reduce to **Orders**.

```sql
orders (
  id UUID PK,
  vertical_code ENUM,
  product_code ENUM,

  customer_user_id UUID,
  pickup_location GEO,
  dropoff_location GEO,

  scheduled_at TIMESTAMP NULL,
  status ENUM,        -- PENDING → MATCHED → IN_PROGRESS → COMPLETED / CANCELLED

  pricing_snapshot JSONB,
  final_amount DECIMAL,

  created_at TIMESTAMP
)
```

Specialized tables **extend**, never replace:

```sql
ride_order_details
delivery_order_details
truck_order_details
```

---

# 3. Service Ownership Boundaries (Critical for AI IDE)

Each service owns **exactly one responsibility**.

```text
Identity Service
- Users, roles, auth, profiles

Order Service
- Orders lifecycle (all verticals)

Trip Service
- Physical execution (drivers, vehicles, routes)

Matching Service
- Driver assignment logic ONLY

Pricing Service
- Fare calculation, surge, discounts

Location Service
- GPS ingest, tracking, replay

Communication Service
- Chat, notifications, templates

Safety Service
- SOS, ride checks, recording

Reputation Service
- Ratings, tags, bias mitigation

Fraud Service
- Risk scoring, enforcement

Subscription Service
- Corporate plans, entitlements

Analytics Service
- Metrics, experiments, forecasts
```

> AI rule: **No service may write another service’s database.**

---

# 4. Deterministic Ride & Sharing Model

## 4.1 Ride Types (Explicit)

```text
SOLO
SHARED
SCHEDULED
LONG_DISTANCE
CORPORATE
WOMEN_ONLY
```

Each Order declares exactly one.

---

## 4.2 Shared Trips (Pooling)

```sql
shared_trips (
  id UUID PK,
  driver_id UUID,
  vehicle_id UUID,

  total_capacity INT,
  seats_used INT,

  route_plan JSONB,        -- ordered pickup/dropoff list
  status ENUM,

  created_at TIMESTAMP
)
```

Orders attach via:

```sql
shared_trip_orders (
  shared_trip_id UUID,
  order_id UUID,
  seat_count INT
)
```

Constraints (machine-readable):

```yaml
max_detour_minutes: 8
max_pickups: 3
max_shared_orders: 4
```

---

# 5. Driver Assignment (Formal Scoring Contract)

## 5.1 Driver Quality Profile (Materialized)

```sql
driver_quality_profile (
  driver_id UUID PK,

  avg_rating_30d FLOAT,
  cancellation_rate_30d FLOAT,
  acceptance_rate_30d FLOAT,
  eta_accuracy_30d FLOAT,

  fairness_boost FLOAT,
  last_updated TIMESTAMP
)
```

---

## 5.2 Assignment Score Formula (Frozen Interface)

```python
score =
  0.35 * eta_score +
  0.25 * rating_score +
  0.15 * reliability_score +
  0.15 * fairness_boost +
  0.10 * vehicle_match
```

Hard constraints:

* max_eta_threshold
* gender restrictions
* corporate eligibility
* fatigue limits

> AI rule: **Weights are config, not code.**

---

# 6. Heatmaps & Demand Guidance

## 6.1 Zone Model

```sql
demand_zones (
  id UUID PK,
  city_id UUID,
  geofence POLYGON
)
```

```sql
demand_zone_metrics (
  zone_id UUID,
  time_bucket TIMESTAMP,

  requests INT,
  active_drivers INT,
  intensity_score FLOAT
)
```

Derived artifact:

* Heatmap tiles (read-only)
* Bonus zones (separate config)

---

# 7. Chat & Communication (Ride-Scoped)

```sql
conversations (
  id UUID PK,
  order_id UUID,
  rider_id UUID,
  driver_id UUID,
  status ENUM
)
```

```sql
messages (
  id UUID PK,
  conversation_id UUID,
  sender_role ENUM,
  type ENUM,        -- TEXT | QUICK | SYSTEM
  content TEXT,
  created_at TIMESTAMP
)
```

Rules:

* Chat auto-expires after trip completion
* Moderation runs async
* Phone numbers never exposed

---

# 8. Multi-Service (Super-App Ready)

## 8.1 Verticals

```text
RIDE
MOTO
FOOD
GROCERY
GOODS
TRUCK_VAN
```

Each Product declares:

* vehicle requirements
* capacity constraints
* pricing strategy
* cancellation policy

---

# 9. Women-Only Driver Service (First-Class)

```sql
driver_preferences (
  driver_id UUID,
  accepts_women_only BOOLEAN
)
```

```sql
order_restrictions (
  order_id UUID,
  restriction ENUM -- NONE | WOMEN_ONLY | PREFER_FEMALE
)
```

Matching rule:

* WOMEN_ONLY = hard filter
* PREFER_FEMALE = soft priority

---

# 10. Corporate Subscriptions (Long-Term)

```sql
company_plans (
  id UUID PK,
  monthly_fee DECIMAL,
  included_verticals JSONB,
  per_ride_discount FLOAT,
  policy JSONB
)
```

```sql
employee_entitlements (
  user_id UUID,
  company_plan_id UUID,
  monthly_allowance DECIMAL
)
```

Billing:

* Central invoicing
* Per-employee usage caps
* Cost center tagging

---

# 11. Event Model (Mandatory for AI)

Every mutation emits an event.

```text
ORDER_CREATED
ORDER_MATCHED
TRIP_STARTED
TRIP_STOP_COMPLETED
TRIP_COMPLETED
RATING_SUBMITTED
FRAUD_FLAGGED
SOS_TRIGGERED
```

Event schema **must be defined once** and reused.

---

# 12. What This Enables an AI IDE to Do

With this refactor, an AI IDE can reliably:

* Generate DB schemas without conflicts
* Create microservices with clean boundaries
* Implement matching logic deterministically
* Add new verticals without refactors
* Enforce safety, fairness, and compliance rules
* Avoid hallucinated entities and flows

---

# 13. Next (Optional, High-Value)

If you want, I can:

1. Convert this into **machine-readable YAML/JSON specs**
2. Produce **AI-IDE prompts per service** (“Generate Order Service APIs…”)
3. Generate **OpenAPI + Event schemas**
4. Produce **reference implementations** (Postgres + Kafka + gRPC)
5. Create a **“do not hallucinate” guardrail file for AI agents**

Just tell me which output format your AI IDE expects first.

