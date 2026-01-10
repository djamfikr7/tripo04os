import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { CommunicationService } from '../services/communication.service';
import { CreateConversationDto, UpdateConversationDto } from '../dto/conversation.dto';
import { SendMessageDto, MessageReceiptDto } from '../dto/message.dto';
import {
  CreateNotificationDto,
  MarkNotificationReadDto,
  GetNotificationsDto,
} from '../dto/notification.dto';

@Controller('api/v1/communication')
export class CommunicationController {
  private readonly logger = new Logger(CommunicationController.name);

  constructor(private readonly communicationService: CommunicationService) {}

  // ==================== Conversation Endpoints ====================

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  async createConversation(
    @Body() dto: CreateConversationDto,
  ) {
    this.logger.log(`POST /conversations - orderId: ${dto.orderId}`);
    const conversation = await this.communicationService.createConversation(dto);
    return {
      success: true,
      data: conversation,
    };
  }

  @Get('conversations/order/:orderId')
  async getConversationByOrderId(@Param('orderId') orderId: string) {
    this.logger.log(`GET /conversations/order/${orderId}`);
    const conversation = await this.communicationService.getConversationByOrderId(orderId);
    return {
      success: true,
      data: conversation,
    };
  }

  @Get('conversations/:conversationId')
  async getConversationById(@Param('conversationId') conversationId: string) {
    this.logger.log(`GET /conversations/${conversationId}`);
    const conversation = await this.communicationService.getConversationById(conversationId);
    return {
      success: true,
      data: conversation,
    };
  }

  @Put('conversations/:conversationId')
  async updateConversation(
    @Param('conversationId') conversationId: string,
    @Body() dto: UpdateConversationDto,
  ) {
    this.logger.log(`PUT /conversations/${conversationId}`);
    const conversation = await this.communicationService.updateConversation(
      conversationId,
      dto,
    );
    return {
      success: true,
      data: conversation,
    };
  }

  @Get('users/:userId/conversations')
  async getUserConversations(@Param('userId') userId: string) {
    this.logger.log(`GET /users/${userId}/conversations`);
    const conversations = await this.communicationService.getConversationsByUserId(userId);
    return {
      success: true,
      data: conversations,
    };
  }

  // ==================== Message Endpoints ====================

  @Post('messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(@Body() dto: SendMessageDto) {
    this.logger.log(
      `POST /messages - orderId: ${dto.orderId}, sender: ${dto.senderId}`,
    );
    const message = await this.communicationService.createMessage(dto);
    return {
      success: true,
      data: message,
    };
  }

  @Get('conversations/:conversationId/messages')
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('before') before?: string,
  ) {
    this.logger.log(`GET /conversations/${conversationId}/messages`);
    const messages = await this.communicationService.getMessages({
      conversationId,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
      before,
    });
    return {
      success: true,
      data: messages,
    };
  }

  @Get('messages/:messageId')
  async getMessageById(@Param('messageId') messageId: string) {
    this.logger.log(`GET /messages/${messageId}`);
    const message = await this.communicationService.getMessageById(messageId);
    return {
      success: true,
      data: message,
    };
  }

  @Get('users/:userId/messages/unread')
  async getUnreadMessages(@Param('userId') userId: string) {
    this.logger.log(`GET /users/${userId}/messages/unread`);
    const messages = await this.communicationService.getUnreadMessages(userId);
    return {
      success: true,
      data: messages,
    };
  }

  // ==================== Message Receipt Endpoints ====================

  @Post('message-receipts')
  @HttpCode(HttpStatus.CREATED)
  async createMessageReceipt(@Body() dto: MessageReceiptDto) {
    this.logger.log(
      `POST /message-receipts - messageId: ${dto.messageId}, userId: ${dto.userId}`,
    );
    const receipt = await this.communicationService.createMessageReceipt(dto);
    return {
      success: true,
      data: receipt,
    };
  }

  // ==================== Notification Endpoints ====================

  @Post('notifications')
  @HttpCode(HttpStatus.CREATED)
  async createNotification(@Body() dto: CreateNotificationDto) {
    this.logger.log(`POST /notifications - userId: ${dto.userId}`);
    const notification = await this.communicationService.createNotification(dto);
    return {
      success: true,
      data: notification,
    };
  }

  @Post('notifications/bulk')
  @HttpCode(HttpStatus.CREATED)
  async createBulkNotifications(@Body() dtos: CreateNotificationDto[]) {
    this.logger.log(`POST /notifications/bulk - count: ${dtos.length}`);
    const notifications = await this.communicationService.createBulkNotifications(dtos);
    return {
      success: true,
      data: notifications,
    };
  }

  @Get('notifications')
  async getNotifications(@Query() query: GetNotificationsDto) {
    this.logger.log(`GET /notifications - userId: ${query.userId}`);
    const notifications = await this.communicationService.getNotifications(query);
    return {
      success: true,
      data: notifications,
    };
  }

  @Get('notifications/:notificationId')
  async getNotificationById(@Param('notificationId') notificationId: string) {
    this.logger.log(`GET /notifications/${notificationId}`);
    const notification = await this.communicationService.getNotificationById(notificationId);
    return {
      success: true,
      data: notification,
    };
  }

  @Put('notifications/:notificationId/read')
  async markNotificationAsRead(
    @Param('notificationId') notificationId: string,
  ) {
    this.logger.log(`PUT /notifications/${notificationId}/read`);
    const notification = await this.communicationService.markNotificationAsRead({
      notificationId,
    });
    return {
      success: true,
      data: notification,
    };
  }

  @Put('users/:userId/notifications/read-all')
  async markAllNotificationsAsRead(@Param('userId') userId: string) {
    this.logger.log(`PUT /users/${userId}/notifications/read-all`);
    await this.communicationService.markAllNotificationsAsRead(userId);
    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }

  @Get('users/:userId/notifications/unread-count')
  async getUnreadNotificationCount(@Param('userId') userId: string) {
    this.logger.log(`GET /users/${userId}/notifications/unread-count`);
    const count = await this.communicationService.getUnreadNotificationCount(userId);
    return {
      success: true,
      data: { count },
    };
  }

  @Delete('notifications/:notificationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotification(@Param('notificationId') notificationId: string) {
    this.logger.log(`DELETE /notifications/${notificationId}`);
    await this.communicationService.deleteNotification(notificationId);
    return {
      success: true,
      message: 'Notification deleted',
    };
  }

  // ==================== Health Check Endpoint ====================

  @Get('health')
  @HttpCode(HttpStatus.OK)
  health() {
    return {
      status: 'ok',
      service: 'communication-service',
      timestamp: new Date().toISOString(),
    };
  }
}
