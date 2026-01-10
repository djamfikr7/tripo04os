# Communication Service - Test Specifications

**Service:** Communication Service (Node.js + NestJS + Socket.io)
**Priority:** P2 (Core Service)
**Status:** Implementation Complete - Testing Phase

---

## Overview

The Communication Service provides real-time messaging and notification capabilities for the Tripo04OS platform. This document outlines comprehensive test requirements for the service.

---

## Test Goals

1. **Coverage Target:** >90% unit test coverage
2. **Performance:** WebSocket connections < 100ms, Message persistence < 50ms
3. **Reliability:** 99.9% uptime for WebSocket gateway
4. **Security:** Proper authentication and authorization for all endpoints

---

## Unit Tests

### Conversation Management Tests

**File:** `src/services/communication.service.spec.ts`

#### Test 1: Create New Conversation
- **Given:** An order ID, rider ID, driver ID (optional), and vertical type
- **When:** `createConversation()` is called
- **Then:**
  - Conversation is created with correct order ID, rider ID, vertical
  - Status is set to ACTIVE
  - `startedAt` is set to current time
  - `messageCount` is initialized to 0
  - Conversation ID is generated

#### Test 2: Create Duplicate Conversation
- **Given:** An active conversation exists for order ID
- **When:** `createConversation()` is called with same order ID
- **Then:** Existing conversation is returned (no duplicate created)

#### Test 3: Get Conversation by Order ID
- **Given:** A conversation exists for order ID
- **When:** `getConversationByOrderId()` is called
- **Then:**
  - Conversation is returned with correct ID
  - Messages relation is populated
  - Returns NotFoundException if not found

#### Test 4: Get Conversation by ID
- **Given:** A conversation with specific ID exists
- **When:** `getConversationById()` is called
- **Then:**
  - Conversation is returned with correct ID
  - Messages relation is populated
  - Returns NotFoundException if not found

#### Test 5: Update Conversation Status
- **Given:** A conversation with ACTIVE status
- **When:** `updateConversation()` is called with CLOSED status
- **Then:**
  - Status is updated to CLOSED
  - `endedAt` is set to current time

#### Test 6: Get User Conversations
- **Given:** Multiple conversations for a user (as rider and driver)
- **When:** `getConversationsByUserId()` is called
- **Then:**
  - Returns all conversations where user is rider OR driver
  - Results ordered by `lastMessageAt` DESC

---

### Message Management Tests

#### Test 7: Create Message
- **Given:** A valid SendMessageDto with sender ID, receiver ID, content
- **When:** `createMessage()` is called
- **Then:**
  - Message is saved to database with correct fields
  - Message status is set to SENT
  - MessageReceipt is automatically created for receiver
  - `createdAt` and `updatedAt` are set

#### Test 8: Create Message with Invalid Conversation
- **Given:** SendMessageDto with non-existent order ID
- **When:** `createMessage()` is called
- **Then:** NotFoundException is thrown

#### Test 9: Get Messages for Conversation
- **Given:** A conversation with multiple messages
- **When:** `getMessages()` is called with conversation ID
- **Then:**
  - Returns messages ordered by `createdAt` DESC
  - Respects limit parameter
  - Respects offset parameter
  - Respects `before` timestamp for pagination

#### Test 10: Get Message by ID
- **Given:** A message with specific ID exists
- **When:** `getMessageById()` is called
- **Then:**
  - Message is returned with correct ID
  - Receipts relation is populated
  - Returns NotFoundException if not found

#### Test 11: Get Unread Messages
- **Given:** User has messages with DELIVERED receipts (not READ)
- **When:** `getUnreadMessages()` is called
- **Then:**
  - Returns messages where user has DELIVERED receipt
  - Results ordered by `createdAt` ASC

---

### Message Receipt Tests

#### Test 12: Create Delivery Receipt
- **Given:** A message exists for user
- **When:** `createMessageReceipt()` is called with DELIVERED status
- **Then:**
  - Receipt is created with correct message ID and user ID
  - `deliveredAt` is set to current time
  - `readAt` is null
  - Delivery status is DELIVERED

#### Test 13: Create Read Receipt
- **Given:** A message exists for user
- **When:** `createMessageReceipt()` is called with READ status
- **Then:**
  - Receipt is created with correct message ID and user ID
  - `readAt` is set to current time
  - Delivery status is READ

#### Test 14: Create Duplicate Receipt
- **Given:** A receipt already exists for message ID and user ID
- **When:** `createMessageReceipt()` is called again
- **Then:** Existing receipt is returned (no duplicate created)

#### Test 15: Update Message Status After Read
- **Given:** All recipients have read a message
- **When:** `createMessageReceipt()` is called with READ status
- **Then:** Message status is updated to READ

---

### Notification Tests

#### Test 16: Create Notification
- **Given:** A valid CreateNotificationDto
- **When:** `createNotification()` is called
- **Then:**
  - Notification is saved with correct fields
  - Delivery status is PENDING
  - Read status is false
  - `createdAt` is set

#### Test 17: Create Bulk Notifications
- **Given:** Array of CreateNotificationDto objects
- **When:** `createBulkNotifications()` is called
- **Then:**
  - All notifications are saved
  - Returns array of created notifications

#### Test 18: Get Notifications with Filters
- **Given:** Multiple notifications for a user
- **When:** `getNotifications()` is called with filters
- **Then:**
  - Respects type filter
  - Respects unreadOnly filter
  - Respects limit and offset
  - Results ordered by `createdAt` DESC

#### Test 19: Mark Notification as Read
- **Given:** A notification with readStatus=false
- **When:** `markNotificationAsRead()` is called
- **Then:**
  - Read status is set to true
  - `readAt` is set to current time
  - Notification is updated in database

#### Test 20: Mark All Notifications as Read
- **Given:** Multiple unread notifications for a user
- **When:** `markAllNotificationsAsRead()` is called
- **Then:**
  - All user notifications have readStatus=true
  - All have `readAt` set

#### Test 21: Delete Notification
- **Given:** A notification with specific ID exists
- **When:** `deleteNotification()` is called
- **Then:** Notification is removed from database

#### Test 22: Get Unread Notification Count
- **Given:** Multiple notifications for a user (some read, some unread)
- **When:** `getUnreadNotificationCount()` is called
- **Then:** Returns count of unread notifications only

#### Test 23: Send Order Update Notification
- **Given:** Order ID, user ID, and update type
- **When:** `sendOrderUpdateNotification()` is called
- **Then:**
  - Notification is created with correct title and body based on type
  - Data includes order ID and update data
  - Priority is set to HIGH

---

### Order Update Notification Tests

#### Test 24: Order Assigned Notification
- **Given:** NotificationType.ORDER_ASSIGNED
- **When:** `sendOrderUpdateNotification()` is called
- **Then:** Title = "Driver Assigned", body includes order ID

#### Test 25: Driver Arrived Notification
- **Given:** NotificationType.DRIVER_ARRIVED
- **When:** `sendOrderUpdateNotification()` is called
- **Then:** Title = "Driver Arrived", body includes order ID

#### Test 26: Trip Completed Notification
- **Given:** NotificationType.TRIP_COMPLETED
- **When:** `sendOrderUpdateNotification()` is called
- **Then:** Title = "Trip Completed", body includes order ID

#### Test 27: Payment Failed Notification
- **Given:** NotificationType.PAYMENT_FAILED
- **When:** `sendOrderUpdateNotification()` is called
- **Then:** Title = "Payment Failed", body includes order ID

---

### Cleanup Tests

#### Test 28: Archive Old Conversations
- **Given:** Conversations with `lastMessageAt` older than 30 days
- **When:** `archiveOldConversations()` is called
- **Then:** Conversations status is updated to ARCHIVED

#### Test 29: Cleanup Old Messages
- **Given:** Messages from CLOSED conversations older than 90 days
- **When:** `cleanupOldMessages()` is called
- **Then:** Old messages are deleted from database

---

## Controller Tests

### Conversation Controller Tests

**File:** `src/controllers/communication.controller.spec.ts`

#### Test 30: POST /conversations
- **Given:** Valid CreateConversationDto
- **When:** Endpoint is called
- **Then:**
  - Returns 201 CREATED
  - Response body includes success=true
  - Response includes created conversation

#### Test 31: GET /conversations/order/:orderId
- **Given:** Valid order ID
- **When:** Endpoint is called
- **Then:**
  - Returns 200 OK
  - Response includes conversation with messages

#### Test 32: PUT /conversations/:conversationId
- **Given:** Valid conversation ID and UpdateConversationDto
- **When:** Endpoint is called
- **Then:**
  - Returns 200 OK
  - Conversation status is updated

#### Test 33: GET /users/:userId/conversations
- **Given:** Valid user ID
- **When:** Endpoint is called
- **Then:**
  - Returns 200 OK
  - Returns array of user conversations

---

### Message Controller Tests

#### Test 34: POST /messages
- **Given:** Valid SendMessageDto
- **When:** Endpoint is called
- **Then:**
  - Returns 201 CREATED
  - Response includes created message

#### Test 35: GET /conversations/:conversationId/messages
- **Given:** Valid conversation ID with query parameters
- **When:** Endpoint is called
- **Then:**
  - Returns 200 OK
  - Respects limit, offset, before query params
  - Returns array of messages

#### Test 36: GET /users/:userId/messages/unread
- **Given:** Valid user ID
- **When:** Endpoint is called
- **Then:**
  - Returns 200 OK
  - Returns array of unread messages

---

### Notification Controller Tests

#### Test 37: POST /notifications
- **Given:** Valid CreateNotificationDto
- **When:** Endpoint is called
- **Then:**
  - Returns 201 CREATED
  - Response includes created notification

#### Test 38: POST /notifications/bulk
- **Given:** Array of CreateNotificationDto
- **When:** Endpoint is called
- **Then:**
  - Returns 201 CREATED
  - Response includes array of created notifications

#### Test 39: GET /notifications
- **Given:** Valid query parameters
- **When:** Endpoint is called
- **Then:**
  - Returns 200 OK
  - Respects type, unreadOnly, limit, offset params
  - Returns array of notifications

#### Test 40: PUT /notifications/:notificationId/read
- **Given:** Valid notification ID
- **When:** Endpoint is called
- **Then:**
  - Returns 200 OK
  - Notification is marked as read

#### Test 41: PUT /users/:userId/notifications/read-all
- **Given:** Valid user ID
- **When:** Endpoint is called
- **Then:**
  - Returns 200 OK
  - All user notifications marked as read

#### Test 42: GET /users/:userId/notifications/unread-count
- **Given:** Valid user ID
- **When:** Endpoint is called
- **Then:**
  - Returns 200 OK
  - Response includes count field

#### Test 43: DELETE /notifications/:notificationId
- **Given:** Valid notification ID
- **When:** Endpoint is called
- **Then:**
  - Returns 204 NO CONTENT
  - Notification is deleted

---

## WebSocket Gateway Tests

### Connection Tests

**File:** `src/gateway/communication.gateway.spec.ts`

#### Test 44: Handle Valid Connection
- **Given:** Socket connection with userId and role
- **When:** Client connects
- **Then:**
  - User is added to users map
  - 'connected' event is sent to client
  - Client receives socket ID

#### Test 45: Handle Invalid Connection
- **Given:** Socket connection without userId or role
- **When:** Client connects
- **Then:** Connection is rejected and disconnected

#### Test 46: Handle Disconnection
- **Given:** Connected client
- **When:** Client disconnects
- **Then:**
  - User is removed from users map
  - User leaves all rooms
  - User data is cleaned up

---

### Room Management Tests

#### Test 47: Join Room
- **Given:** Connected client
- **When:** Client sends 'joinRoom' event
- **Then:**
  - Client joins room named `order:{orderId}`
  - Room info is added to rooms map
  - 'roomJoined' event is sent to client

#### Test 48: Leave Room
- **Given:** Client in room
- **When:** Client sends 'leaveRoom' event
- **Then:**
  - Client leaves room
  - Room info is removed from rooms map
  - 'roomLeft' event is sent to client

---

### Messaging Tests

#### Test 49: Send Message
- **Given:** Client in room, valid message data
- **When:** Client sends 'sendMessage' event
- **Then:**
  - Message is persisted in database
  - Receipt is created for receiver
  - 'message' event is broadcast to room
  - Message includes timestamp

#### Test 50: Send Message with Invalid Data
- **Given:** Client in room, invalid message data
- **When:** Client sends 'sendMessage' event
- **Then:**
  - 'error' event is sent to client
  - Message is not broadcast

#### Test 51: Mark Message as Read
- **Given:** Valid message ID and user ID
- **When:** Client sends 'markMessageAsRead' event
- **Then:**
  - Receipt is created with READ status
  - Message status is updated if all recipients read
  - 'messageRead' event is sent to client

#### Test 52: Mark All as Read
- **Given:** Valid user ID
- **When:** Client sends 'markAllAsRead' event
- **Then:**
  - All user notifications marked as read
  - 'allMessagesRead' event is sent to client

---

### Broadcast Tests

#### Test 53: Broadcast Order Update
- **Given:** Order ID and update data
- **When:** `broadcastOrderUpdate()` is called
- **Then:**
  - 'orderUpdate' event is sent to room
  - All clients in room receive update

#### Test 54: Broadcast Driver Location
- **Given:** Driver ID and location data
- **When:** `broadcastDriverLocation()` is called
- **Then:**
  - 'driverLocation' event is broadcast to all clients

#### Test 55: Send Notification to User
- **Given:** User ID and notification data
- **When:** `sendNotificationToUser()` is called
- **Then:**
  - 'notification' event is sent to user's sockets
  - User receives notification

---

## Integration Tests

### Database Integration Tests

**File:** `test/integration/communication.integration.spec.ts`

#### Test 56: End-to-End Message Flow
- **Given:** Rider and driver connected via WebSocket
- **When:** Rider sends message to driver
- **Then:**
  - Message saved in database
  - Driver receives message via WebSocket
  - Receipt created for driver
  - Conversation message count incremented

#### Test 57: End-to-End Notification Flow
- **Given:** User connected via WebSocket
- **When:** Order status changes to DRIVER_ARRIVED
- **Then:**
  - Notification created in database
  - User receives notification via WebSocket
  - Notification has correct title and body

#### Test 58: End-to-End Read Receipt Flow
- **Given:** Driver received message from rider
- **When:** Driver marks message as read
- **Then:**
  - Receipt updated to READ status
  - Rider notified of read status
  - Message status updated to READ

---

## Performance Tests

#### Test 59: Message Throughput
- **Given:** 1000 concurrent users
- **When:** All users send messages
- **Then:**
  - Average message persistence time < 50ms
  - WebSocket broadcast latency < 100ms
  - No message loss

#### Test 60: Connection Handling
- **Given:** 10000 concurrent WebSocket connections
- **When:** All clients connect
- **Then:**
  - All connections accepted
  - Memory usage remains within limits (< 2GB)
  - No connection failures

#### Test 61: Database Query Performance
- **Given:** 100000 messages in database
- **When:** Query messages with pagination
- **Then:**
  - Query time < 100ms
  - Pagination works correctly
  - No performance degradation

---

## Security Tests

#### Test 62: Unauthenticated WebSocket Connection
- **Given:** Client tries to connect without userId
- **When:** Connection attempted
- **Then:** Connection is rejected

#### Test 63: Unauthorized Room Join
- **Given:** User not part of order
- **When:** User tries to join order room
- **Then:** Access denied

#### Test 64: SQL Injection Prevention
- **Given:** Message with SQL injection payload
- **When:** `createMessage()` is called
- **Then:** Payload is escaped, no SQL executed

#### Test 65: XSS Prevention
- **Given:** Message with XSS payload
- **When:** Message is retrieved
- **Then:** Payload is sanitized, no script executed

---

## Test Coverage Requirements

### Files to Test

1. **Services** (Target: >95% coverage)
   - `src/services/communication.service.ts`

2. **Controllers** (Target: >90% coverage)
   - `src/controllers/communication.controller.ts`

3. **Gateway** (Target: >90% coverage)
   - `src/gateway/communication.gateway.ts`

4. **Entities** (Target: >80% coverage)
   - `src/entities/conversation.entity.ts`
   - `src/entities/message.entity.ts`
   - `src/entities/message-receipt.entity.ts`
   - `src/entities/notification.entity.ts`

5. **DTOs** (Target: >70% coverage)
   - `src/dto/message.dto.ts`
   - `src/dto/conversation.dto.ts`
   - `src/dto/notification.dto.ts`

---

## Test Execution

### Running Unit Tests

```bash
cd backend_services/communication_service
npm run test
```

### Running Tests with Coverage

```bash
npm run test:cov
```

### Running Integration Tests

```bash
npm run test:e2e
```

---

## Success Criteria

- [ ] All unit tests pass (100% pass rate)
- [ ] Test coverage >90% (target: 95%)
- [ ] All integration tests pass
- [ ] All performance tests meet criteria
- [ ] All security tests pass
- [ ] No TypeScript errors
- [ ] No linting errors

---

## Next Steps

After tests are complete:
1. Run `npm run lint` to check for linting errors
2. Run `npm run build` to ensure TypeScript compilation
3. Create Docker image and test in containerized environment
4. Deploy to dev environment and verify WebSocket connectivity
