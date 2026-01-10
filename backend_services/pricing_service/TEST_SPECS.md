# Pricing Service - Test Specifications

## Unit Tests

### Pricing Service Tests
- [ ] Test pricing rule creation
- [ ] Test pricing rule update
- [ ] Test pricing rule deletion
- [ ] Test base fare calculation
- [ ] Test distance fare calculation
- [ ] Test time fare calculation
- [ ] Test surge multiplier application
- [ ] Test discount application
- [ ] Test total fare calculation

### Surge Service Tests
- [ ] Test surge zone creation
- [ ] Test surge zone update
- [ ] Test surge zone deletion
- [ ] Test surge multiplier calculation
- [ ] Test demand level detection
- [ ] Test dynamic surge adjustment
- [ ] Test surge zone geospatial queries

### Pricing Repository Tests
- [ ] Test create pricing rule
- [ ] Test find pricing rule by ID
- [ ] Test find pricing rules by type
- [ ] Test find active pricing rules
- [ ] Test find pricing rules by service type
- [ ] Test find pricing rules by vehicle type
- [ ] Test update pricing rule
- [ ] Test soft delete pricing rule

### Pricing Controller Tests
- [ ] Test POST /pricing/rules - create pricing rule
- [ ] Test GET /pricing/rules/:id - get pricing rule
- [ ] Test PUT /pricing/rules/:id - update pricing rule
- [ ] Test DELETE /pricing/rules/:id - delete pricing rule
- [ ] Test POST /pricing/calculate - calculate price
- [ ] Test POST /pricing/surge - get surge status
- [ ] Test GET /pricing/surge-zones - list surge zones

## Integration Tests

### Database Integration
- [ ] Test pricing rule creation with PostgreSQL
- [ ] Test pricing rule updates with PostgreSQL
- [ ] Test pricing rule cascading deletes
- [ ] Test PostGIS geospatial queries for surge zones
- [ ] Test database transaction rollback on errors

### Kafka Integration
- [ ] Test pricing calculation event publishing
- [ ] Test surge update event publishing
- [ ] Test price adjustment event publishing
- [ ] Test Kafka consumer for order events
- [ ] Test Kafka consumer for trip events

### Service Integration
- [ ] Test pricing with order service validation
- [ ] Test pricing with location service for distance calculation
- [ ] Test pricing with trip service for actual data

## E2E Tests

### Order Flow Tests
- [ ] Test complete pricing flow: order → calculate → apply surge → total price
- [ ] Test order pricing with surge
- [ ] Test order pricing with discount
- [ ] Test order pricing with multiple rule matches
- [ ] Test order with no matching rules

### Edge Cases
- [ ] Test pricing with invalid distance
- [ ] Test pricing with negative time
- [ ] Test pricing with extreme surge values
- [ ] Test pricing with zero base fare
- [ ] Test pricing with high volume order

## Performance Tests

### Load Tests
- [ ] Test 100 concurrent price calculations
- [ ] Test 1000 pricing rule queries
- [ ] Test 5000 surge zone queries per minute
- [ ] Test sustained load of 100 req/sec for 10 minutes

### Stress Tests
- [ ] Test system behavior under 10x normal load
- [ ] Test database connection pooling under load
- [ ] Test PostGIS geospatial queries under heavy load

## Coverage Targets
- Unit tests: > 90% coverage
- Integration tests: > 80% coverage
- E2E tests: Critical paths covered
