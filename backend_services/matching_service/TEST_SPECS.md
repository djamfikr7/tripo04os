# Matching Service - Test Specifications

## Unit Tests

### Algorithm Tests
- [x] Test distance calculation (Haversine formula)
- [x] Test ETA calculation
- [x] Test ETA score normalization
- [x] Test rating score normalization
- [x] Test reliability score normalization
- [x] Test fairness boost calculation
- [x] Test vehicle match calculation
- [x] Test overall match score calculation
- [x] Test finding best matches
- [x] Test no available drivers scenario

### API Tests
- [x] Test health check endpoint
- [x] Test readiness endpoint
- [x] Test find drivers endpoint (no drivers scenario)
- [x] Test get configuration endpoint

### Service Tests
- [ ] Test DriverService.get_available_drivers
- [ ] Test DriverService.get_recent_matches
- [ ] Test DriverService.record_driver_match
- [ ] Test DriverService.update_driver_availability
- [ ] Test DriverService.update_match_response

## Integration Tests

### Database Integration
- [ ] Test matching with PostgreSQL driver availability table
- [ ] Test recording matches in database
- [ ] Test updating driver availability in database
- [ ] Test transaction rollback on errors

### Kafka Integration
- [ ] Test publishing match events to Kafka
- [ ] Test consuming order events from Kafka
- [ ] Test consuming driver response events from Kafka

### Service Integration
- [ ] Test integration with Location Service for driver positions
- [ ] Test integration with Order Service for order status
- [ ] Test integration with Pricing Service for fare calculation

## E2E Tests

### Order Flow Tests
- [ ] Test complete matching flow: order → find drivers → select driver → driver accepts
- [ ] Test order cancellation flow: order → find drivers → cancel
- [ ] Test driver decline flow: order → find drivers → driver declines → find new drivers

### Edge Cases
- [ ] Test matching with no available drivers
- [ ] Test matching with all drivers too far
- [ ] Test matching with invalid pickup/destination coordinates
- [ ] Test concurrent matching requests for same order
- [ ] Test matching with disabled/unverified drivers

## Performance Tests

### Load Tests
- [ ] Test 100 concurrent match requests
- [ ] Test 1000 driver availability queries per minute
- [ ] Test sustained load of 100 req/sec for 10 minutes

### Stress Tests
- [ ] Test system behavior under 10x normal load
- [ ] Test database connection pooling under load
- [ ] Test algorithm performance with 1000 available drivers

## Coverage Targets
- Unit tests: > 90% coverage
- Integration tests: > 80% coverage
- E2E tests: Critical paths covered
