import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Message, MessageStatus, MessageType } from '../entities/message.entity';
import { MessageReceipt, DeliveryStatus } from '../entities/message-receipt.entity';
import { Conversation, ConversationStatus, VerticalType } from '../entities/conversation.entity';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationDeliveryStatus,
} from '../entities/notification.entity';
import {
  SendMessageDto,
  MessageReceiptDto,
} from '../dto/message.dto';
import {
  CreateConversationDto,
  UpdateConversationDto,
  GetMessagesDto,
} from '../dto/conversation.dto';
import {
  CreateNotificationDto,
  MarkNotificationReadDto,
  GetNotificationsDto,
} from '../dto/notification.dto';

@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(MessageReceipt)
    private receiptRepository: Repository<MessageReceipt>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private dataSource: DataSource,
  ) {}

  // ==================== Conversation Methods ====================

  async createConversation(dto: CreateConversationDto): Promise<Conversation> {
    this.logger.log(`Creating conversation for order: ${dto.orderId}`);

    // Check if conversation already exists for this order
    const existingConversation = await this.conversationRepository.findOne({
      where: { orderId: dto.orderId, status: ConversationStatus.ACTIVE },
    });

    if (existingConversation) {
      this.logger.log(`Conversation already exists for order: ${dto.orderId}`);
      return existingConversation;
    }

    const conversation = this.conversationRepository.create({
      orderId: dto.orderId,
      riderId: dto.riderId,
      driverId: dto.driverId,
      vertical: dto.vertical,
      status: ConversationStatus.ACTIVE,
      startedAt: new Date(),
      messageCount: 0,
    });

    return await this.conversationRepository.save(conversation);
  }

  async getConversationByOrderId(orderId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { orderId },
      relations: ['messages'],
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation not found for order: ${orderId}`);
    }

    return conversation;
  }

  async getConversationById(conversationId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['messages'],
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation not found: ${conversationId}`);
    }

    return conversation;
  }

  async updateConversation(
    conversationId: string,
    dto: UpdateConversationDto,
  ): Promise<Conversation> {
    const conversation = await this.getConversationById(conversationId);

    if (dto.status) {
      conversation.status = dto.status;

      if (dto.status === ConversationStatus.CLOSED) {
        conversation.endedAt = new Date();
      }
    }

    return await this.conversationRepository.save(conversation);
  }

  async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    return await this.conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.riderId = :userId', { userId })
      .orWhere('conversation.driverId = :userId', { userId })
      .orderBy('conversation.lastMessageAt', 'DESC')
      .getMany();
  }

  // ==================== Message Methods ====================

  async createMessage(dto: SendMessageDto): Promise<Message> {
    this.logger.log(
      `Creating message from ${dto.senderRole} to ${dto.receiverId}`,
    );

    // Get or create conversation
    let conversation = await this.conversationRepository.findOne({
      where: { orderId: dto.orderId },
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversation not found for order: ${dto.orderId}`,
      );
    }

    const message = this.messageRepository.create({
      conversationId: conversation.id,
      orderId: dto.orderId,
      senderId: dto.senderId,
      receiverId: dto.receiverId,
      senderRole: dto.senderRole,
      content: dto.content,
      messageType: dto.messageType || MessageType.TEXT,
      metadata: dto.metadata || {},
      status: MessageStatus.SENT,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Create receipt for receiver
    await this.createMessageReceipt({
      messageId: savedMessage.id,
      userId: dto.receiverId,
      deliveryStatus: DeliveryStatus.DELIVERED,
    });

    this.logger.log(`Message created: ${savedMessage.id}`);

    return savedMessage;
  }

  async getMessages(dto: GetMessagesDto): Promise<Message[]> {
    const { conversationId, limit = 50, offset = 0, before } = dto;

    const query = this.messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId })
      .orderBy('message.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (before) {
      query.andWhere('message.createdAt < :before', { before: new Date(before) });
    }

    return await query.getMany();
  }

  async getMessageById(messageId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['receipts'],
    });

    if (!message) {
      throw new NotFoundException(`Message not found: ${messageId}`);
    }

    return message;
  }

  async getUnreadMessages(userId: string): Promise<Message[]> {
    const unreadReceipts = await this.receiptRepository.find({
      where: { userId, deliveryStatus: DeliveryStatus.DELIVERED },
      relations: ['message'],
      order: { createdAt: 'ASC' },
    });

    return unreadReceipts.map((receipt) => receipt.message);
  }

  // ==================== Message Receipt Methods ====================

  async createMessageReceipt(dto: MessageReceiptDto): Promise<MessageReceipt> {
    this.logger.log(
      `Creating receipt for message: ${dto.messageId}, user: ${dto.userId}`,
    );

    const existingReceipt = await this.receiptRepository.findOne({
      where: { messageId: dto.messageId, userId: dto.userId },
    });

    if (existingReceipt) {
      this.logger.warn(`Receipt already exists for message: ${dto.messageId}`);
      return existingReceipt;
    }

    const receipt = this.receiptRepository.create({
      messageId: dto.messageId,
      userId: dto.userId,
      deliveryStatus: dto.deliveryStatus as DeliveryStatus,
      deviceId: dto.deviceId,
      deliveredAt:
        dto.deliveryStatus === DeliveryStatus.DELIVERED ? new Date() : undefined,
      readAt:
        dto.deliveryStatus === DeliveryStatus.READ ? new Date() : undefined,
    });

    const savedReceipt = await this.receiptRepository.save(receipt);

    // Update message status if all recipients have read
    if (dto.deliveryStatus === DeliveryStatus.READ) {
      await this.updateMessageReadStatus(dto.messageId, dto.userId);
    }

    return savedReceipt;
  }

  private async updateMessageReadStatus(
    messageId: string,
    userId: string,
  ): Promise<void> {
    const message = await this.getMessageById(messageId);

    // Check if sender wants to know about read status
    // (In a real implementation, this would check user preferences)
    const allReceipts = await this.receiptRepository.find({
      where: { messageId },
    });

    const allRead = allReceipts.every(
      (receipt) => receipt.deliveryStatus === DeliveryStatus.READ,
    );

    if (allRead) {
      message.status = MessageStatus.READ;
      await this.messageRepository.save(message);
    }
  }

  // ==================== Notification Methods ====================

  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    this.logger.log(`Creating notification for user: ${dto.userId}`);

    const notification = this.notificationRepository.create({
      userId: dto.userId,
      notificationType: dto.notificationType,
      title: dto.title,
      body: dto.body,
      data: dto.data || {},
      priority: dto.priority || NotificationPriority.NORMAL,
      deliveryStatus: NotificationDeliveryStatus.PENDING,
      readStatus: false,
      actionUrl: dto.actionUrl,
      expiryAt: dto.expiryAt ? new Date(dto.expiryAt) : undefined,
    });

    const savedNotification = await this.notificationRepository.save(notification);

    this.logger.log(`Notification created: ${savedNotification.id}`);

    return savedNotification;
  }

  async createBulkNotifications(
    dtos: CreateNotificationDto[],
  ): Promise<Notification[]> {
    this.logger.log(`Creating bulk notifications: ${dtos.length}`);

    const notifications = this.notificationRepository.create(dtos);
    return await this.notificationRepository.save(notifications);
  }

  async getNotifications(dto: GetNotificationsDto): Promise<Notification[]> {
    const {
      userId,
      type,
      unreadOnly = false,
      limit = 50,
      offset = 0,
    } = dto;

    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (type) {
      query.andWhere('notification.notificationType = :type', { type });
    }

    if (unreadOnly) {
      query.andWhere('notification.readStatus = :readStatus', {
        readStatus: false,
      });
    }

    return await query.getMany();
  }

  async getNotificationById(notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification not found: ${notificationId}`);
    }

    return notification;
  }

  async markNotificationAsRead(
    dto: MarkNotificationReadDto,
  ): Promise<Notification> {
    const notification = await this.getNotificationById(dto.notificationId);

    if (!notification.readStatus) {
      notification.readStatus = true;
      notification.readAt = new Date();
      await this.notificationRepository.save(notification);
    }

    return notification;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, readStatus: false },
      { readStatus: true, readAt: new Date() },
    );
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await this.notificationRepository.delete(notificationId);
  }

  async deleteExpiredNotifications(): Promise<void> {
    const now = new Date();

    await this.notificationRepository.delete({
      expiryAt: { $lt: now } as any,
    });

    this.logger.log('Expired notifications deleted');
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: { userId, readStatus: false },
    });
  }

  // ==================== Order Update Notifications ====================

  async sendOrderUpdateNotification(
    orderId: string,
    userId: string,
    updateType: NotificationType,
    updateData: Record<string, any>,
  ): Promise<Notification> {
    const titles: Record<NotificationType, string> = {
      [NotificationType.ORDER_ASSIGNED]: 'Driver Assigned',
      [NotificationType.ORDER_CANCELLED]: 'Order Cancelled',
      [NotificationType.DRIVER_ARRIVED]: 'Driver Arrived',
      [NotificationType.TRIP_STARTED]: 'Trip Started',
      [NotificationType.TRIP_COMPLETED]: 'Trip Completed',
      [NotificationType.PAYMENT_SUCCESS]: 'Payment Successful',
      [NotificationType.PAYMENT_FAILED]: 'Payment Failed',
      [NotificationType.PROMOTION]: 'Special Offer',
      [NotificationType.SYSTEM_ALERT]: 'System Alert',
      [NotificationType.RATING_REQUEST]: 'Rate Your Trip',
      [NotificationType.NEW_MESSAGE]: 'New Message',
    };

    const bodies: Record<NotificationType, string> = {
      [NotificationType.ORDER_ASSIGNED]: `Your driver has been assigned for order #${orderId}`,
      [NotificationType.ORDER_CANCELLED]: `Order #${orderId} has been cancelled`,
      [NotificationType.DRIVER_ARRIVED]: `Your driver has arrived for order #${orderId}`,
      [NotificationType.TRIP_STARTED]: `Your trip for order #${orderId} has started`,
      [NotificationType.TRIP_COMPLETED]: `Your trip for order #${orderId} is complete`,
      [NotificationType.PAYMENT_SUCCESS]: `Payment for order #${orderId} was successful`,
      [NotificationType.PAYMENT_FAILED]: `Payment for order #${orderId} failed. Please try again.`,
      [NotificationType.PROMOTION]: 'Check out our special offers!',
      [NotificationType.SYSTEM_ALERT]: 'Important system update',
      [NotificationType.RATING_REQUEST]: 'Please rate your recent trip',
      [NotificationType.NEW_MESSAGE]: 'You have a new message',
    };

    return await this.createNotification({
      userId,
      notificationType: updateType,
      title: titles[updateType],
      body: bodies[updateType],
      data: { orderId, ...updateData },
      priority: NotificationPriority.HIGH,
    });
  }

  // ==================== Cleanup Methods ====================

  async archiveOldConversations(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.conversationRepository.update(
      {
        status: ConversationStatus.ACTIVE,
        lastMessageAt: { $lt: cutoffDate } as any,
      },
      { status: ConversationStatus.ARCHIVED },
    );

    this.logger.log(`Archived ${result.affected || 0} old conversations`);

    return result.affected || 0;
  }

  async cleanupOldMessages(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Delete messages older than cutoff date for closed conversations
    const result = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoin('message.conversation', 'conversation')
      .where('conversation.status = :status', {
        status: ConversationStatus.CLOSED,
      })
      .andWhere('message.createdAt < :cutoffDate', { cutoffDate })
      .delete()
      .execute();

    this.logger.log(`Cleaned up ${result.affected || 0} old messages`);

    return result.affected || 0;
  }
}
