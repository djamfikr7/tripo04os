import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  Logger,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CommunicationService } from '../services/communication.service';
import { MessageType, SenderRole } from '../entities/message.entity';
import { DeliveryStatus } from '../entities/message-receipt.entity';
import { NotificationType } from '../entities/notification.entity';

interface UserInfo {
  userId: string;
  role: 'RIDER' | 'DRIVER' | 'ADMIN';
  socketId: string;
  connectedAt: Date;
}

interface RoomInfo {
  orderId: string;
  riderId: string;
  driverId?: string;
  createdAt: Date;
}

@WebSocketGateway({
  cors: {
    origin: process.env.SOCKET_IO_CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/',
  pingTimeout: parseInt(process.env.SOCKET_IO_PING_TIMEOUT || '30000'),
  pingInterval: parseInt(process.env.SOCKET_IO_PING_INTERVAL || '25000'),
})
export class Gateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(Gateway.name);
  private users: Map<string, UserInfo> = new Map();
  private rooms: Map<string, RoomInfo> = new Map();

  constructor(private readonly communicationService: CommunicationService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const role = client.handshake.query.role as 'RIDER' | 'DRIVER' | 'ADMIN';

    if (!userId || !role) {
      this.logger.warn(`Connection rejected: missing userId or role`);
      client.disconnect();
      return;
    }

    client.data.userId = userId;
    client.data.role = role;

    this.users.set(client.id, {
      userId,
      role,
      socketId: client.id,
      connectedAt: new Date(),
    });

    this.logger.log(`Client connected: ${client.id}, User: ${userId}, Role: ${role}`);

    client.emit('connected', {
      status: 'connected',
      socketId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    const userInfo = this.users.get(client.id);

    if (userInfo) {
      this.logger.log(
        `Client disconnected: ${client.id}, User: ${userInfo.userId}, Role: ${userInfo.role}`,
      );

      this.leaveAllRooms(client);
      this.users.delete(client.id);
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { orderId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `order:${data.orderId}`;

    try {
      client.join(roomName);

      const roomInfo = {
        orderId: data.orderId,
        riderId: data.userId,
        createdAt: new Date(),
      };

      this.rooms.set(roomName, roomInfo);

      this.logger.log(
        `User ${data.userId} joined room ${roomName} (socket: ${client.id})`,
      );

      client.emit('roomJoined', {
        orderId: data.orderId,
        status: 'joined',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Error joining room ${roomName}:`, error);
      client.emit('error', {
        message: 'Failed to join room',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `order:${data.orderId}`;

    client.leave(roomName);
    this.rooms.delete(roomName);

    this.logger.log(
      `Socket ${client.id} left room ${roomName}`,
    );

    client.emit('roomLeft', {
      orderId: data.orderId,
      status: 'left',
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody()
    data: {
      orderId: string;
      senderId: string;
      receiverId: string;
      senderRole: string;
      message: string;
      type?: string;
      metadata?: Record<string, any>;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `order:${data.orderId}`;

    try {
      const senderRole = this.parseSenderRole(data.senderRole);

      const message = await this.communicationService.createMessage({
        orderId: data.orderId,
        senderId: data.senderId,
        receiverId: data.receiverId,
        senderRole,
        content: data.message,
        messageType: this.parseMessageType(data.type),
        metadata: data.metadata || {},
      });

      this.server.to(roomName).emit('message', {
        orderId: data.orderId,
        messageId: message.id,
        senderId: data.senderId,
        receiverId: data.receiverId,
        senderRole: data.senderRole,
        message: data.message,
        type: data.type || 'TEXT',
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`Message sent in room ${roomName}:`, {
        messageId: message.id,
        senderId: data.senderId,
      });
    } catch (error) {
      this.logger.error(`Error sending message in room ${roomName}:`, error);
      client.emit('error', {
        message: 'Failed to send message',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  @SubscribeMessage('markMessageAsRead')
  async handleMarkMessageAsRead(
    @MessageBody() data: { messageId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.communicationService.createMessageReceipt({
        messageId: data.messageId,
        userId: data.userId,
        deliveryStatus: DeliveryStatus.READ,
      });

      this.logger.log(`Message marked as read: ${data.messageId} by ${data.userId}`);

      client.emit('messageRead', {
        messageId: data.messageId,
        status: 'read',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Error marking message as read:`, error);
      client.emit('error', {
        message: 'Failed to mark message as read',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  @SubscribeMessage('markAllAsRead')
  async handleMarkAllAsRead(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.communicationService.markAllNotificationsAsRead(data.userId);

      this.logger.log(`All notifications marked as read for user: ${data.userId}`);

      client.emit('allMessagesRead', {
        status: 'success',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Error marking all as read:`, error);
      client.emit('error', {
        message: 'Failed to mark all as read',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  broadcastOrderUpdate(orderId: string, update: any) {
    const roomName = `order:${orderId}`;
    this.server.to(roomName).emit('orderUpdate', {
      orderId,
      update,
      timestamp: new Date().toISOString(),
    });
  }

  broadcastDriverLocation(driverId: string, location: any) {
    this.server.emit('driverLocation', {
      driverId,
      location,
      timestamp: new Date().toISOString(),
    });
  }

  sendNotificationToUser(userId: string, notification: any) {
    this.users.forEach((userInfo, socketId) => {
      if (userInfo.userId === userId) {
        this.server.to(socketId).emit('notification', {
          ...notification,
          timestamp: new Date().toISOString(),
        });
      }
    });
  }

  async sendOrderUpdateNotification(
    orderId: string,
    userId: string,
    updateType: NotificationType,
    updateData: Record<string, any>,
  ) {
    const notification = await this.communicationService.sendOrderUpdateNotification(
      orderId,
      userId,
      updateType,
      updateData,
    );

    this.sendNotificationToUser(userId, notification);
  }

  private parseSenderRole(role: string): SenderRole {
    const upperRole = role.toUpperCase();
    if (Object.values(SenderRole).includes(upperRole as SenderRole)) {
      return upperRole as SenderRole;
    }
    return SenderRole.RIDER;
  }

  private parseMessageType(type?: string): MessageType {
    if (!type) return MessageType.TEXT;

    const upperType = type.toUpperCase();
    if (Object.values(MessageType).includes(upperType as MessageType)) {
      return upperType as MessageType;
    }
    return MessageType.TEXT;
  }

  private leaveAllRooms(client: Socket) {
    const rooms = client.rooms;
    rooms.forEach((room) => {
      if (room.startsWith('order:')) {
        client.leave(room);
        this.rooms.delete(room);
      }
    });
  }
}
