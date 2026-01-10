# Safety Service - Test Specifications

**Service:** Safety Service (Go + Gin Framework)
**Priority:** P3 (Advanced Service)
**Status:** Implementation Complete - Testing Phase

---

## Overview

The Safety Service provides emergency response, trip monitoring, and safety analytics for Tripo04OS platform. This document outlines comprehensive test requirements for the service.

---

## Test Goals

1. **Coverage Target:** >90% unit test coverage
2. **Performance:** SOS alert creation < 100ms, Ride check execution < 200ms
3. **Reliability:** 99.9% uptime for safety-critical features
4. **Security:** Proper authentication for all endpoints
5. **Data Integrity:** Correct handling of emergency data with encryption

---

## Unit Tests

### SOS Alert Tests

**File:** `tests/sos_alert_test.go`

#### Test 1: Create SOS Alert
- **Given:** Valid SOS alert data (EMERGENCY type, GPS location, rider ID)
- **When:** `CreateSOSAlert()` is called
- **Then:**
  - Alert is created with correct ID
  - AlertType matches input
  - Status is set to PENDING
  - `TriggeredAt` is set to current time
  - Emergency service is notified

#### Test 2: Get SOS Alert by ID
- **Given:** SOS alert exists
- **When:** `GetSOSAlert()` is called with valid ID
- **Then:**
  - Alert is returned with correct data
  - Returns error if not found

#### Test 3: Get SOS Alerts by Trip ID
- **Given:** Multiple SOS alerts for a trip
- **When:** `GetSOSAlertsByTrip()` is called
- **Then:**
  - Returns all alerts for the trip
  - Results ordered by `triggered_at` DESC

#### Test 4: Get Active SOS Alerts
- **Given:** Multiple SOS alerts with PENDING/IN_PROGRESS status
- **When:** `GetActiveSOSAlerts()` is called
- **Then:**
  - Returns only active alerts
  - Results ordered by `triggered_at` DESC

#### Test 5: Update SOS Alert Status
- **Given:** SOS alert with PENDING status
- **When:** `UpdateSOSAlertStatus()` is called with RESOLVED status
- **Then:**
  - Status is updated to RESOLVED
  - `ResolvedAt` is set to current time
  - `ResolvedBy` and `ResolutionNotes` are set

#### Test 6: Acknowledge SOS Alert
- **Given:** SOS alert with PENDING status
- **When:** `MarkSOSAlertAcknowledged()` is called
- **Then:**
  - `AcknowledgedAt` is set to current time
  - Returns no error

#### Test 7: Get SOS Alerts by Status
- **Given:** Multiple SOS alerts with RESOLVED status
- **When:** `GetSOSAlertsByStatus()` is called with limit
- **Then:**
  - Returns only RESOLVED alerts
  - Respects limit parameter
  - Results ordered by `triggered_at` DESC

---

### Ride Check Tests

#### Test 8: Schedule Ride Check
- **Given:** Trip ID, rider ID, driver ID, scheduled time
- **When:** `ScheduleRideCheck()` is called
- **Then:**
  - Check is created with correct trip/rider/driver IDs
  - CheckType is set (SCHEDULED)
  - Status is set to SCHEDULED
  - `ScheduledFor` is set correctly

#### Test 9: Get Pending Ride Checks
- **Given:** Multiple ride checks scheduled in past
- **When:** `GetPendingRideChecks()` is called
- **Then:**
  - Returns checks where scheduled_for <= now
  - Results ordered by `scheduled_for` ASC

#### Test 10: Execute Ride Check
- **Given:** Ride check with SCHEDULED status
- **When:** `ExecuteRideCheck()` is called with response type OK
- **Then:**
  - Status is updated to COMPLETED
  - `CheckTime` is set to current time
  - `ResponseType` is set to OK
  - FollowUpRequired is false

#### Test 11: Execute Ride Check with Concern
- **Given:** Ride check with CONCERN response
- **When:** `ExecuteRideCheck()` is called
- **Then:**
  - Status is updated to COMPLETED
  - FollowUpRequired is true

#### Test 12: Mark Ride Check Failed
- **Given:** Ride check with SCHEDULED status
- **When:** `MarkRideCheckFailed()` is called
- **Then:**
  - Status is updated to FAILED
  - Reason notes are saved

#### Test 13: Skip Ride Check
- **Given:** Ride check with SCHEDULED status
- **When:** `SkipRideCheck()` is called
- **Then:**
  - Status is updated to SKIPPED

#### Test 14: Get Ride Checks by Trip
- **Given:** Multiple ride checks for a trip
- **When:** `GetRideChecksByTrip()` is called
- **Then:**
  - Returns all checks for the trip
  - Results ordered by `check_time` DESC

---

### Trip Recording Tests

#### Test 15: Create Trip Recording
- **Given:** Trip ID, driver ID, recording type VIDEO
- **When:** `CreateTripRecording()` is called
- **Then:**
  - Recording is created with correct trip/driver IDs
- - RecordingType matches input
  - Status is set to UPLOADING
  - IsEncrypted is true
- `UploadStartedAt` is set

#### Test 16: Upload Trip Recording
- **Given:** Trip recording with S3 storage URL
- **When:** `UploadTripRecording()` is called
- **Then:**
  - StorageURL is set
  - Status is updated to PROCESSING
  - `UploadCompletedAt` is set

#### Test 17: Mark Recording Ready
- **Given:** Trip recording with PROCESSING status
- **When:** `MarkRecordingReady()` is called
- **Then:**
  - Status is updated to READY

#### Test 18: Get Trip Recording by ID
- **Given:** Trip recording exists
- **When:** `GetTripRecording()` is called
- **Then:**
  - Recording is returned with correct data
  - Returns error if not found

#### Test 19: Get Trip Recordings by Trip
- **Given:** Multiple recordings for a trip
- **When:** `GetTripRecordingsByTrip()` is called
- **Then:**
  - Returns all recordings for the trip
  - Results ordered by `created_at` DESC

#### Test 20: Delete Expired Recordings
- **Given:** Recordings with retention date in past
- **When:** `DeleteExpiredRecordings()` is called
- **Then:**
  - Expired recordings are deleted
  - Returns count of deleted recordings
  - Retention policy (90 days) is enforced

---

### Safety Event Tests

#### Test 21: Create Safety Event
- **Given:** Safety event with SPEEDING type, threshold exceeded
- **When:** `CreateSafetyEvent()` is called
- **Then:**
  - Event is created with correct IDs
  - EventType matches input
  - Severity is set correctly
  - Status is set to DETECTED
  - Threshold and actual values are stored

#### Test 22: Get Safety Event by ID
- **Given:** Safety event exists
- **When:** `GetSafetyEvent()` is called with valid ID
- **Then:**
  - Event is returned with correct data
  - Returns error if not found

#### Test 23: Get Safety Events by Driver
- **Given:** Multiple safety events for a driver
- **When:** `GetSafetyEventsByDriver()` is called with limit
- **Then:**
  - Returns events for the driver
  - Respects limit parameter
  - Results ordered by `created_at` DESC

#### Test 24: Get High Severity Events
- **Given:** Safety events with HIGH/CRITICAL severity
- **When:** `GetHighSeverityEvents()` is called
- **Then:**
  - Returns only high severity events
  - Results ordered by `created_at` DESC

#### Test 25: Review Safety Event
- **Given:** Safety event with DETECTED status
- **When:** `ReviewSafetyEvent()` is called with CONFIRMED status
- **Then:**
  - Status is updated to CONFIRMED
- `ReviewedBy` is set
- - `ReviewedAt` is set to current time
  - `ReviewNotes` and `ActionTaken` are set

#### Test 26: Get Events Needing Review
- **Given:** Safety events with DETECTED/REVIEWING status
- **When:** `GetEventsNeedingReview()` is called
- **Then:**
  - Returns events needing review
  - Results ordered by severity DESC
  - Results ordered by `created_at` ASC (oldest first)

#### Test 27: Get Safety Stats
- **Given:** Driver with safety events
- **When:** `GetSafetyStats()` is called
- **Then:**
  - Returns map with stats:
    - total_events count
    - high_severity_count
    - speeding_count
    - hard_braking_count
    - off_route_count

#### Test 28: Get Driver Performance Score
- **Given:** Driver with safety events in last 30 days
- **When:** `GetDriverPerformanceScore()` is called
- **Then:**
  - Performance score between 0-100
- - Score decreases with high severity events
- - No events = 100.0

#### Test 29: Cleanup Old Data
- **Given:** Expired recordings exist
- **When:** `CleanupOldData()` is called
- **Then:**
  - Expired recordings are deleted
  - Returns count of deleted recordings

---

## Controller Tests

### HTTP Status Tests

#### Test 30: POST /api/v1/safety/sos-alerts
- **Given:** Valid SOS alert data
- **When:** POST endpoint is called
- **Then:**
  - Returns 201 CREATED
  - Response includes created alert with ID

#### Test 31: GET /api/v1/safety/sos-alerts/:id
- **Given:** Valid SOS alert ID
- **When:** GET endpoint is called
- **Then:**
  - Returns 200 OK
  - Response includes alert data

#### Test 32: PUT /api/v1/safety/sos-alerts/:id/acknowledge
- **Given:** Valid SOS alert ID
- **When:** PUT endpoint is called
- **Then:**
  - Returns 200 OK
  - Success message returned

#### Test 33: PUT /api/v1/safety/sos-alerts/:id/resolve
- **Given:** Valid SOS alert ID with resolve data
- **When:** PUT endpoint is called
- **Then:**
  - Returns 200 OK
  - Status updated to RESOLVED

#### Test 34: GET /api/v1/safety/sos-alerts/active
- **Given:** Active SOS alerts exist
- **When:** GET endpoint is called
- **Then:**
  - Returns 200 OK
  - Response includes active alerts array

#### Test 35: POST /api/v1/safety/ride-checks
- **Given:** Valid ride check data
- **When:** POST endpoint is called
- **Then:**
  - Returns 201 CREATED
  - Response includes created check with ID

#### Test 36: GET /api/v1/safety/ride-checks/pending
- **Given:** Pending ride checks exist
- **When:** GET endpoint is called
- **Then:**
  - Returns 200 OK
  - Response includes pending checks array

#### Test 37: POST /api/v1/safety/trip-recordings
- **Given:** Valid trip recording data
- **When:** POST endpoint is called
- **Then:**
  - Returns 201 CREATED
  - Response includes created recording with ID

#### Test 38: PUT /api/v1/safety/trip-recordings/:id/upload
- **Given:** Trip recording ID and S3 URL
- **When:** PUT endpoint is called
- **Then:**
  - Returns 200 OK
  - StorageURL updated

#### Test 39: GET /api/v1/safety/safety-events/high-severity
- **Given:** High severity safety events exist
- **When:** GET endpoint is called
- **Then:**
  - Returns 200 OK
  - Response includes events array

#### Test 40: GET /api/v1/safety/drivers/:driverId/performance-score
- **Given:** Driver with safety events
- **When:** GET endpoint is called
- **Then:**
  - Returns 200 OK
  - Response includes performance score

#### Test 41: POST /api/v1/safety/cleanup
- **Given:** Old data exists
- **When:** POST endpoint is called
- **Then:**
  Returns 200 OK
  - Cleanup completed successfully

---

## Service Tests

### Error Handling Tests

#### Test 42: Invalid SOS Alert Type
- **Given:** SOS alert with invalid alert type
- **When:** POST endpoint is called
- **Then:**
  - Returns 400 Bad Request
  - Error message "Invalid alert_type"

#### Test 43: Missing Required Field
- **Given:** SOS alert without trip_id
- **When:** POST endpoint is called
- **Then:**
  - Returns 400 Bad Request
  - Error message about missing field

#### Test 44: Non-existent SOS Alert
- **Given:** Non-existent SOS alert ID
- **When:** GET endpoint is called with invalid ID
- **Then:**
  - Returns 404 Not Found
  - Error message "SOS alert not found"

#### Test 45: Invalid Ride Check Type
- **Given:** Ride check with invalid check_type
- **When:** POST endpoint is called
- **Then:**
  - Returns 400 Bad Request
  - Error message "Invalid check_type"

#### Test 46: Invalid Safety Event Type
- **Given:** Safety event with invalid event_type
- **When:** POST endpoint is called
- **Then:**
  - Returns 400 Bad Request
  - Error message "Invalid event_type"

---

## Integration Tests

**File:** `tests/safety_integration_test.go`

#### Test 47: End-to-End SOS Flow
- **Given:** Rider triggers SOS during trip
- **When:** SOS endpoint is called
- **Then:**
  - Alert is created in database
  - Emergency service is notified
  - Support team can view alert
  - Alert status can be updated
  - Alert can be resolved with notes

#### Test 48: Automated Ride Check Execution
- **Given:** Scheduled ride check time arrives
- **When:** Scheduler triggers ride check
- **Then:**
  - Check is executed (marked IN_PROGRESS then COMPLETED)
  - Rider responds (response is recorded)
  - Driver location captured
  - Follow-up scheduled if CONCERN or DISTRESS

#### Test 49: Trip Recording Upload
- **Given:** Trip completes with video recording
- **When:** Upload endpoint is called
- **Then:**
  - Recording is uploaded to S3
  - Status transitions: UPLOADING → PROCESSING → READY
  - S3 storage URL is stored

#### Test 50: Safety Event Detection
- **Given:** Driver exceeds speed threshold
- **When:** Event endpoint is called
- **Then:**
  - Safety event is created with severity HIGH
- - Event is captured with speed data
- - Driver ID is linked
- - Event is queued for review

---

## Performance Tests

#### Test 51: SOS Alert Creation Performance
- **Given:** 1000 concurrent SOS alerts
- **When:** All SOS alerts are created simultaneously
- **Then:**
  - Average creation time < 100ms
  - No timeout errors
  - Database handles concurrent writes

#### Test 52: Ride Check Execution Performance
- **Given:** 1000 ride checks
- **When:** All ride checks are executed
- **Then:**
  - Average execution time < 200ms
  - Status updates are efficient
  - No lost checks

#### Test 53: Safety Event Creation Performance
- **Given:** 1000 safety events
- **When:** All safety events are created
- **Then:**
  - Average creation time < 50ms
  - Batch operations if possible

#### Test 54: Recording Upload Performance
- **Given:** 10 GB video files
- **When:** All recordings are uploaded
- **Then:**
  - Average upload time < 5 seconds/GB
  - Upload bandwidth efficient
  - Retry logic handles failures

---

## Security Tests

#### Test 55: Unauthenticated Access
- **Given:** No authentication token
- **When:** Any endpoint is called
- **Then:**
  - Returns 401 Unauthorized
  - No alert/check/recording created

#### Test 56: SQL Injection Prevention
- **Given:** Description field with SQL payload
- **When:** SOS alert is created
- **Then:**
  - Payload is escaped
  - No SQL executed
  - Attack logged

#### Test 57: XSS Prevention
- **Given:** Additional info field with XSS payload
- **When:** SOS alert is created
- **Then:**
  - Payload is sanitized
  - No script executed
  - Event logged

#### Test 58: Authorization Bypass
- **Given:** User tries to access another user's alerts
- **When:** SOS alert endpoint is called for different user's trip
- **Then:**
  - Returns 403 Forbidden
  - Access denied

#### Test 59: Data Encryption
- **Given:** Trip recording with sensitive data
- **When:** Recording is created
- **Then:**
  - IsEncrypted flag is set to true
  - Encryption key ID is assigned
- - Data is encrypted at rest in S3

#### Test 60: S3 Bucket Security
- **Given:** Invalid S3 credentials
- **When:** Recording upload is attempted
- **Then:**
  - Upload fails
  - Error is logged
  - Alert is generated

---

## Test Coverage Requirements

### Files to Test

1. **Services** (Target: >95% coverage)
   - `internal/services/safety_service.go`

2. **Models** (Target: >90% coverage)
   - `internal/models/sos_alert.go`
   - `internal/models/ride_check.go`
   - `internal/models/trip_recording.go`
   - `internal/models/safety_event.go`

3. **Handlers** (Target: >90% coverage)
   - `internal/handlers/safety_handler.go`

4. **Tests** (Target: >90% coverage)
   - `tests/sos_alert_test.go`
   - `tests/ride_check_test.go`
   - `tests/trip_recording_test.go`
   - `tests/safety_event_test.go`
   - `tests/safety_integration_test.go`

---

## Test Execution

### Running Unit Tests

```bash
cd backend_services/safety_service
go test ./...
```

### Running Tests with Coverage

```bash
go test ./... -cover
```

### Running Integration Tests

```bash
go test ./tests/... -tags=integration
```

---

## Success Criteria

- [ ] All unit tests pass (100% pass rate)
- [ ] Test coverage >90% (target: 95%)
- [ ] All integration tests pass
- [ ] All performance tests meet criteria
- [ ] All security tests pass
- [ ] No Go compilation errors
- [ ] No linting errors

---

## Next Steps

After tests are complete:
1. Run `go build ./...` to ensure compilation
2. Create Docker image and test in containerized environment
3. Deploy to dev environment and verify all endpoints
4. Monitor for any production issues in first week
