import { Test, TestingModule } from '@nestjs/testing';
import { CommunicationController } from '../src/controllers/communication.controller';
import { CommunicationService } from '../src/services/communication.service';
import { CreateConversationDto } from '../src/dto/conversation.dto';
import { SendMessageDto } from '../src/dto/message.dto';
import { CreateNotificationDto } from '../src/dto/notification.dto';
import { MessageType } from '../src/entities/message.entity';
import { VerticalType } from '../src/entities/conversation.entity';
import { NotificationType } from '../src/entities/notification.entity';

describe('CommunicationController', () => {
  let controller: CommunicationController;
  let service: CommunicationService;

  const mockConversation = {
    id: 'conversation-1',
    orderId: 'order-1',
    riderId: 'rider-1',
    driverId: 'driver-1',
    vertical: VerticalType.RIDE,
    status: 'ACTIVE',
    startedAt: new Date(),
    messageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMessage = {
    id: 'message-1',
    conversationId: 'conversation-1',
    orderId: 'order-1',
    senderId: 'rider-1',
    receiverId: 'driver-1',
    senderRole: 'RIDER',
    content: 'Hello driver',
    messageType: MessageType.TEXT,
    metadata: {},
    status: 'SENT',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockNotification = {
    id: 'notification-1',
    userId: 'user-1',
    notificationType: NotificationType.ORDER_ASSIGNED,
    title: 'Driver Assigned',
    body: 'Your driver has been assigned',
    data: { orderId: 'order-1' },
    priority: 'HIGH',
    deliveryStatus: 'PENDING',
    readStatus: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunicationController],
      providers: [
        {
          provide: CommunicationService,
          useValue: {
            createConversation: jest.fn().mockResolvedValue(mockConversation),
            getConversationByOrderId: jest.fn().mockResolvedValue(mockConversation),
            getConversationById: jest.fn().mockResolvedValue(mockConversation),
            updateConversation: jest.fn().mockResolvedValue(mockConversation),
            getConversationsByUserId: jest.fn().mockResolvedValue([mockConversation]),
            createMessage: jest.fn().mockResolvedValue(mockMessage),
            getMessageById: jest.fn().mockResolvedValue(mockMessage),
            getMessages: jest.fn().mockResolvedValue([mockMessage]),
            getUnreadMessages: jest.fn().mockResolvedValue([mockMessage]),
            createMessageReceipt: jest.fn().mockResolvedValue({}),
            createNotification: jest.fn().mockResolvedValue(mockNotification),
            createBulkNotifications: jest.fn().mockResolvedValue([mockNotification]),
            getNotifications: jest.fn().mockResolvedValue([mockNotification]),
            getNotificationById: jest.fn().mockResolvedValue(mockNotification),
            markNotificationAsRead: jest.fn().mockResolvedValue(mockNotification),
            markAllNotificationsAsRead: jest.fn().mockResolvedValue(undefined),
            getUnreadNotificationCount: jest.fn().mockResolvedValue(5),
            deleteNotification: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<CommunicationController>(CommunicationController);
    service = module.get<CommunicationService>(CommunicationService);
  });

  describe('POST /api/v1/communication/conversations', () => {
    it('should create a new conversation', async () => {
      const dto: CreateConversationDto = {
        orderId: 'order-1',
        riderId: 'rider-1',
        driverId: 'driver-1',
        vertical: VerticalType.RIDE,
      };

      const result = await controller.createConversation(dto);

      expect(service.createConversation).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        success: true,
        data: mockConversation,
      });
    });
  });

  describe('GET /api/v1/communication/conversations/order/:orderId', () => {
    it('should return conversation for order ID', async () => {
      const result = await controller.getConversationByOrderId('order-1');

      expect(service.getConversationByOrderId).toHaveBeenCalledWith('order-1');
      expect(result).toEqual({
        success: true,
        data: mockConversation,
      });
    });
  });

  describe('GET /api/v1/communication/conversations/:conversationId', () => {
    it('should return conversation by ID', async () => {
      const result = await controller.getConversationById('conversation-1');

      expect(service.getConversationById).toHaveBeenCalledWith('conversation-1');
      expect(result).toEqual({
        success: true,
        data: mockConversation,
      });
    });
  });

  describe('PUT /api/v1/communication/conversations/:conversationId', () => {
    it('should update conversation', async () => {
      const result = await controller.updateConversation('conversation-1', {
        status: 'CLOSED',
      });

      expect(service.updateConversation).toHaveBeenCalledWith('conversation-1', {
        status: 'CLOSED',
      });
      expect(result).toEqual({
        success: true,
        data: mockConversation,
      });
    });
  });

  describe('GET /api/v1/communication/users/:userId/conversations', () => {
    it('should return user conversations', async () => {
      const result = await controller.getUserConversations('user-1');

      expect(service.getConversationsByUserId).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        success: true,
        data: [mockConversation],
      });
    });
  });

  describe('POST /api/v1/communication/messages', () => {
    it('should send a message', async () => {
      const dto: SendMessageDto = {
        orderId: 'order-1',
        senderId: 'rider-1',
        receiverId: 'driver-1',
        senderRole: 'RIDER',
        content: 'Hello driver',
        messageType: MessageType.TEXT,
      };

      const result = await controller.sendMessage(dto);

      expect(service.createMessage).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        success: true,
        data: mockMessage,
      });
    });
  });

  describe('GET /api/v1/communication/conversations/:conversationId/messages', () => {
    it('should return messages for conversation', async () => {
      const result = await controller.getConversationMessages('conversation-1');

      expect(service.getMessages).toHaveBeenCalledWith({
        conversationId: 'conversation-1',
        limit: 50,
        offset: 0,
        before: undefined,
      });
      expect(result).toEqual({
        success: true,
        data: [mockMessage],
      });
    });

    it('should respect query parameters', async () => {
      const result = await controller.getConversationMessages('conversation-1', '10', '5', '2024-01-01');

      expect(service.getMessages).toHaveBeenCalledWith({
        conversationId: 'conversation-1',
        limit: 10,
        offset: 5,
        before: '2024-01-01',
      });
      expect(result).toEqual({
        success: true,
        data: [mockMessage],
      });
    });
  });

  describe('GET /api/v1/communication/messages/:messageId', () => {
    it('should return message by ID', async () => {
      const result = await controller.getMessageById('message-1');

      expect(service.getMessageById).toHaveBeenCalledWith('message-1');
      expect(result).toEqual({
        success: true,
        data: mockMessage,
      });
    });
  });

  describe('GET /api/v1/communication/users/:userId/messages/unread', () => {
    it('should return unread messages for user', async () => {
      const result = await controller.getUnreadMessages('user-1');

      expect(service.getUnreadMessages).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        success: true,
        data: [mockMessage],
      });
    });
  });

  describe('POST /api/v1/communication/message-receipts', () => {
    it('should create message receipt', async () => {
      const dto = {
        messageId: 'message-1',
        userId: 'user-1',
        deliveryStatus: 'DELIVERED',
      };

      const result = await controller.createMessageReceipt(dto);

      expect(service.createMessageReceipt).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        success: true,
        data: {},
      });
    });
  });

  describe('POST /api/v1/communication/notifications', () => {
    it('should create a notification', async () => {
      const dto: CreateNotificationDto = {
        userId: 'user-1',
        notificationType: NotificationType.ORDER_ASSIGNED,
        title: 'Driver Assigned',
        body: 'Your driver has been assigned',
        data: { orderId: 'order-1' },
      };

      const result = await controller.createNotification(dto);

      expect(service.createNotification).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        success: true,
        data: mockNotification,
      });
    });
  });

  describe('POST /api/v1/communication/notifications/bulk', () => {
    it('should create bulk notifications', async () => {
      const dtos: CreateNotificationDto[] = [mockNotification as any];

      const result = await controller.createBulkNotifications(dtos);

      expect(service.createBulkNotifications).toHaveBeenCalledWith(dtos);
      expect(result).toEqual({
        success: true,
        data: [mockNotification],
      });
    });
  });

  describe('GET /api/v1/communication/notifications', () => {
    it('should return notifications', async () => {
      const query = {
        userId: 'user-1',
        unreadOnly: true,
        limit: 50,
      };

      const result = await controller.getNotifications(query);

      expect(service.getNotifications).toHaveBeenCalledWith(query);
      expect(result).toEqual({
        success: true,
        data: [mockNotification],
      });
    });
  });

  describe('PUT /api/v1/communication/notifications/:notificationId/read', () => {
    it('should mark notification as read', async () => {
      const result = await controller.markNotificationAsRead('notification-1');

      expect(service.markNotificationAsRead).toHaveBeenCalledWith({
        notificationId: 'notification-1',
      });
      expect(result).toEqual({
        success: true,
        data: mockNotification,
      });
    });
  });

  describe('PUT /api/v1/communication/users/:userId/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const result = await controller.markAllNotificationsAsRead('user-1');

      expect(service.markAllNotificationsAsRead).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        success: true,
        message: 'All notifications marked as read',
      });
    });
  });

  describe('GET /api/v1/communication/users/:userId/notifications/unread-count', () => {
    it('should return unread notification count', async () => {
      const result = await controller.getUnreadNotificationCount('user-1');

      expect(service.getUnreadNotificationCount).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        success: true,
        data: { count: 5 },
      });
    });
  });

  describe('DELETE /api/v1/communication/notifications/:notificationId', () => {
    it('should delete notification', async () => {
      const result = await controller.deleteNotification('notification-1');

      expect(service.deleteNotification).toHaveBeenCalledWith('notification-1');
      expect(result).toEqual({
        success: true,
        message: 'Notification deleted',
      });
    });
  });

  describe('GET /api/v1/communication/health', () => {
    it('should return health status', () => {
      const result = await controller.health();

      expect(result).toEqual({
        status: 'ok',
        service: 'communication-service',
        timestamp: expect.any(String),
      });
    });
  });
});
