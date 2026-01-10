import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { CommunicationService } from '../src/services/communication.service';
import { Message, MessageStatus } from '../src/entities/message.entity';
import { MessageReceipt, DeliveryStatus } from '../src/entities/message-receipt.entity';
import { Conversation, ConversationStatus, VerticalType } from '../src/entities/conversation.entity';
import {
  Notification,
  NotificationType,
  NotificationPriority,
} from '../src/entities/notification.entity';
import {
  SendMessageDto,
  MessageReceiptDto,
} from '../src/dto/message.dto';
import {
  CreateConversationDto,
  UpdateConversationDto,
} from '../src/dto/conversation.dto';
import {
  CreateNotificationDto,
  MarkNotificationReadDto,
} from '../src/dto/notification.dto';

describe('CommunicationService', () => {
  let service: CommunicationService;
  let conversationRepo: Repository<Conversation>;
  let messageRepo: Repository<Message>;
  let receiptRepo: Repository<MessageReceipt>;
  let notificationRepo: Repository<Notification>;

  const mockConversation = {
    id: 'conversation-1',
    orderId: 'order-1',
    riderId: 'rider-1',
    driverId: 'driver-1',
    vertical: VerticalType.RIDE,
    status: ConversationStatus.ACTIVE,
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
    status: MessageStatus.SENT,
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
    priority: NotificationPriority.HIGH,
    deliveryStatus: 'PENDING',
    readStatus: false,
    createdAt: new Date(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(),
  } as unknown as DataSource;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunicationService,
        {
          provide: getRepositoryToken(Conversation),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Message),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(MessageReceipt),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Notification),
          useClass: Repository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<CommunicationService>(CommunicationService);
    conversationRepo = module.get<Repository<Conversation>>(
      getRepositoryToken(Conversation),
    );
    messageRepo = module.get<Repository<Message>>(getRepositoryToken(Message));
    receiptRepo = module.get<Repository<MessageReceipt>>(
      getRepositoryToken(MessageReceipt),
    );
    notificationRepo = module.get<Repository<Notification>>(
      getRepositoryToken(Notification),
    );
  });

  describe('createConversation', () => {
    it('should create a new conversation', async () => {
      const dto: CreateConversationDto = {
        orderId: 'order-1',
        riderId: 'rider-1',
        driverId: 'driver-1',
        vertical: VerticalType.RIDE,
      };

      jest.spyOn(conversationRepo, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(conversationRepo, 'create')
        .mockReturnValue(mockConversation as any);
      jest
        .spyOn(conversationRepo, 'save')
        .mockResolvedValue(mockConversation as any);

      const result = await service.createConversation(dto);

      expect(result).toEqual(mockConversation);
      expect(conversationRepo.create).toHaveBeenCalled();
      expect(conversationRepo.save).toHaveBeenCalled();
    });

    it('should return existing conversation if it exists', async () => {
      const dto: CreateConversationDto = {
        orderId: 'order-1',
        riderId: 'rider-1',
        vertical: VerticalType.RIDE,
      };

      jest
        .spyOn(conversationRepo, 'findOne')
        .mockResolvedValue(mockConversation as any);

      const result = await service.createConversation(dto);

      expect(result).toEqual(mockConversation);
      expect(conversationRepo.findOne).toHaveBeenCalledWith({
        where: { orderId: 'order-1', status: ConversationStatus.ACTIVE },
      });
    });
  });

  describe('getConversationByOrderId', () => {
    it('should return conversation for valid order ID', async () => {
      jest
        .spyOn(conversationRepo, 'findOne')
        .mockResolvedValue(mockConversation as any);

      const result = await service.getConversationByOrderId('order-1');

      expect(result).toEqual(mockConversation);
      expect(conversationRepo.findOne).toHaveBeenCalledWith({
        where: { orderId: 'order-1' },
        relations: ['messages'],
      });
    });

    it('should throw NotFoundException for non-existent order', async () => {
      jest.spyOn(conversationRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.getConversationByOrderId('non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createMessage', () => {
    it('should create and persist message', async () => {
      const dto: SendMessageDto = {
        orderId: 'order-1',
        senderId: 'rider-1',
        receiverId: 'driver-1',
        senderRole: 'RIDER',
        content: 'Hello driver',
        messageType: MessageType.TEXT,
      };

      jest
        .spyOn(conversationRepo, 'findOne')
        .mockResolvedValue(mockConversation as any);
      jest
        .spyOn(messageRepo, 'create')
        .mockReturnValue(mockMessage as any);
      jest
        .spyOn(messageRepo, 'save')
        .mockResolvedValue(mockMessage as any);
      jest
        .spyOn(receiptRepo, 'create')
        .mockReturnValue({} as any);
      jest.spyOn(receiptRepo, 'save').mockResolvedValue({} as any);

      const result = await service.createMessage(dto);

      expect(result).toEqual(mockMessage);
      expect(messageRepo.create).toHaveBeenCalled();
      expect(messageRepo.save).toHaveBeenCalled();
      expect(receiptRepo.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if conversation does not exist', async () => {
      const dto: SendMessageDto = {
        orderId: 'order-1',
        senderId: 'rider-1',
        receiverId: 'driver-1',
        senderRole: 'RIDER',
        content: 'Hello driver',
      };

      jest.spyOn(conversationRepo, 'findOne').mockResolvedValue(null);

      await expect(service.createMessage(dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createNotification', () => {
    it('should create a new notification', async () => {
      const dto: CreateNotificationDto = {
        userId: 'user-1',
        notificationType: NotificationType.ORDER_ASSIGNED,
        title: 'Driver Assigned',
        body: 'Your driver has been assigned',
        data: { orderId: 'order-1' },
        priority: NotificationPriority.HIGH,
      };

      jest
        .spyOn(notificationRepo, 'create')
        .mockReturnValue(mockNotification as any);
      jest
        .spyOn(notificationRepo, 'save')
        .mockResolvedValue(mockNotification as any);

      const result = await service.createNotification(dto);

      expect(result).toEqual(mockNotification);
      expect(notificationRepo.create).toHaveBeenCalled();
      expect(notificationRepo.save).toHaveBeenCalled();
    });
  });

  describe('createMessageReceipt', () => {
    it('should create a delivery receipt', async () => {
      const dto: MessageReceiptDto = {
        messageId: 'message-1',
        userId: 'user-1',
        deliveryStatus: DeliveryStatus.DELIVERED,
      };

      jest.spyOn(receiptRepo, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(receiptRepo, 'create')
        .mockReturnValue({} as any);
      jest.spyOn(receiptRepo, 'save').mockResolvedValue({} as any);

      const result = await service.createMessageReceipt(dto);

      expect(result).toBeDefined();
      expect(receiptRepo.create).toHaveBeenCalled();
      expect(receiptRepo.save).toHaveBeenCalled();
    });

    it('should return existing receipt if already exists', async () => {
      const dto: MessageReceiptDto = {
        messageId: 'message-1',
        userId: 'user-1',
        deliveryStatus: DeliveryStatus.DELIVERED,
      };

      const existingReceipt = { id: 'receipt-1' };
      jest
        .spyOn(receiptRepo, 'findOne')
        .mockResolvedValue(existingReceipt as any);

      const result = await service.createMessageReceipt(dto);

      expect(result).toEqual(existingReceipt);
      expect(receiptRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('sendOrderUpdateNotification', () => {
    it('should create ORDER_ASSIGNED notification', async () => {
      jest
        .spyOn(notificationRepo, 'create')
        .mockReturnValue(mockNotification as any);
      jest
        .spyOn(notificationRepo, 'save')
        .mockResolvedValue(mockNotification as any);

      const result = await service.sendOrderUpdateNotification(
        'order-1',
        'user-1',
        NotificationType.ORDER_ASSIGNED,
        { driverId: 'driver-1' },
      );

      expect(result).toBeDefined();
      expect(notificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationType: NotificationType.ORDER_ASSIGNED,
          title: 'Driver Assigned',
          priority: NotificationPriority.HIGH,
        }),
      );
    });

    it('should create TRIP_COMPLETED notification', async () => {
      jest
        .spyOn(notificationRepo, 'create')
        .mockReturnValue(mockNotification as any);
      jest
        .spyOn(notificationRepo, 'save')
        .mockResolvedValue(mockNotification as any);

      const result = await service.sendOrderUpdateNotification(
        'order-1',
        'user-1',
        NotificationType.TRIP_COMPLETED,
        {},
      );

      expect(result).toBeDefined();
      expect(notificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationType: NotificationType.TRIP_COMPLETED,
          title: 'Trip Completed',
        }),
      );
    });
  });
});
