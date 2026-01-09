import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface UserInfo {
  userId: string;
  role: 'RIDER' | 'DRIVER' | 'ADMIN';
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
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/',
})
export class Gateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private users: Map<string, UserInfo> = new Map();
  private rooms: Map<string, RoomInfo> = new Map();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const role = client.handshake.query.role as 'RIDER' | 'DRIVER' | 'ADMIN';

    if (!userId || !role) {
      client.disconnect();
      return;
    }

    client.data.userId = userId;
    client.data.role = role;

    this.users.set(client.id, {
      userId,
      role,
      connectedAt: new Date(),
    });

    console.log(`Client connected: ${client.id}, User: ${userId}, Role: ${role}`);

    client.emit('connected', {
      status: 'connected',
      socketId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    const userInfo = this.users.get(client.id);

    if (userInfo) {
      console.log(
        `Client disconnected: ${client.id}, User: ${userInfo.userId}, Role: ${userInfo.role}`,
      );

      this.leaveAllRooms(client);
      this.users.delete(client.id);
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { orderId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `order:${data.orderId}`;

    client.join(roomName);

    this.rooms.set(roomName, {
      orderId: data.orderId,
      riderId: data.userId,
      createdAt: new Date(),
    });

    console.log(
      `User ${data.userId} joined room ${roomName} (socket: ${client.id})`,
    );

    client.emit('roomJoined', {
      orderId: data.orderId,
      status: 'joined',
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `order:${data.orderId}`;

    client.leave(roomName);

    this.rooms.delete(roomName);

    console.log(
      `Socket ${client.id} left room ${roomName}`,
    );

    client.emit('roomLeft', {
      orderId: data.orderId,
      status: 'left',
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('sendMessage')
  handleSendMessage(
    @MessageBody()
    data: {
      orderId: string;
      senderId: string;
      message: string;
      type?: 'TEXT' | 'LOCATION' | 'SYSTEM';
    },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `order:${data.orderId}`;

    this.server.to(roomName).emit('message', {
      orderId: data.orderId,
      senderId: data.senderId,
      message: data.message,
      type: data.type || 'TEXT',
      timestamp: new Date().toISOString(),
    });

    console.log(`Message sent in room ${roomName}:`, data);
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
