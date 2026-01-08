import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderRepository } from './order.repository';
import { Order, OrderStatus, Vertical, RideType } from '../entities/order.entity';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    @Inject('KAFKA_PRODUCER') private readonly kafkaClient: ClientProxy,
  ) {}

  async createOrder(
    riderId: string,
    vertical: Vertical,
    product: string,
    rideType: RideType,
    pickupLocation: { latitude: number; longitude: number; address: string },
    destinationLocation: { latitude: number; longitude: number; address: string },
    scheduledPickupTime?: Date,
    items?: any[],
  ): Promise<Order> {
    const order = await this.orderRepository.create({
      riderId,
      vertical,
      product,
      rideType,
      pickupLocation: `POINT(${pickupLocation.longitude} ${pickupLocation.latitude})`,
      pickupAddress: pickupLocation.address,
      destinationLocation: `POINT(${destinationLocation.longitude} ${destinationLocation.latitude})`,
      destinationAddress: destinationLocation.address,
      scheduledPickupTime,
      status: OrderStatus.PENDING,
    });

    await this.publishOrderCreatedEvent(order);
    return order;
  }

  async getOrderById(id: string): Promise<Order | null> {
    return await this.orderRepository.findById(id);
  }

  async getRiderOrders(
    riderId: string,
    page = 1,
    limit = 10,
  ): Promise<{ orders: Order[]; total: number }> {
    const offset = (page - 1) * limit;
    const [orders, total] = await this.orderRepository.findByRiderId(riderId, limit, offset);
    return { orders, total };
  }

  async getOrdersByStatus(
    status: OrderStatus,
    limit = 50,
  ): Promise<Order[]> {
    return await this.orderRepository.findByStatus(status, limit);
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    const order = await this.orderRepository.update(id, updates);
    if (order) {
      await this.publishOrderUpdatedEvent(order);
    }
    return order;
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const order = await this.orderRepository.updateStatus(id, status);
    if (order) {
      await this.publishOrderUpdatedEvent(order);
      
      switch (status) {
        case OrderStatus.MATCHED:
          await this.publishDriverMatchedEvent(order);
          break;
        case OrderStatus.COMPLETED:
          await this.publishOrderCompletedEvent(order);
          break;
        case OrderStatus.CANCELLED:
          await this.publishOrderCancelledEvent(order);
          break;
      }
    }
    return order;
  }

  async cancelOrder(id: string, reason: string): Promise<Order | null> {
    const order = await this.orderRepository.update(id, {
      status: OrderStatus.CANCELLED,
      cancellationReason: reason,
      cancelledAt: new Date(),
    });
    
    if (order) {
      await this.publishOrderCancelledEvent(order);
    }
    
    return order;
  }

  async deleteOrder(id: string): Promise<boolean> {
    return await this.orderRepository.delete(id);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async expirePendingOrders() {
    this.logger.log('Checking for expired pending orders...');
    
    const expiredTime = new Date(Date.now() - 15 * 60 * 1000);
    const pendingOrders = await this.orderRepository.findPendingOrdersExpiringBefore(expiredTime);
    
    for (const order of pendingOrders) {
      try {
        await this.orderRepository.update(order.id, {
          status: OrderStatus.EXPIRED,
        });
        await this.publishOrderExpiredEvent(order);
      } catch (error) {
        this.logger.error(`Failed to expire order ${order.id}:`, error);
      }
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processPendingOrders() {
    this.logger.log('Processing pending orders...');
    
    const pendingOrders = await this.orderRepository.findByStatus(OrderStatus.PENDING, 50);
    
    for (const order of pendingOrders) {
      if (order.status === OrderStatus.PENDING) {
        await this.orderRepository.update(order.id, {
          status: OrderStatus.SEARCHING,
        });
        await this.publishOrderUpdatedEvent(order);
      }
    }
  }

  async assignDriver(orderId: string, driverId: string): Promise<Order | null> {
    return await this.updateOrder(orderId, {
      driverId,
      status: OrderStatus.DRIVER_ASSIGNED,
    });
  }

  async getDriverActiveOrders(driverId: string): Promise<Order[]> {
    return await this.orderRepository.findActiveOrdersByDriverId(driverId);
  }

  async getDriverOrdersByStatus(
    driverId: string,
    status: OrderStatus,
  ): Promise<Order[]> {
    return await this.orderRepository.findByDriverIdAndStatus(driverId, status);
  }

  private async publishOrderCreatedEvent(order: Order): Promise<void> {
    const event = {
      event_id: `order-created-${order.id}-${Date.now()}`,
      event_timestamp: Date.now(),
      order_id: order.id,
      user_id: order.riderId,
      vertical: order.vertical,
      product: order.product,
      ride_type: order.rideType,
      pickup_location: {
        latitude: parseFloat(order.pickupLocation.split(' ')[1]),
        longitude: parseFloat(order.pickupLocation.split(' ')[0]),
        address: order.pickupAddress,
      },
      destination_location: {
        latitude: parseFloat(order.destinationLocation.split(' ')[1]),
        longitude: parseFloat(order.destinationLocation.split(' ')[0]),
        address: order.destinationAddress,
      },
      scheduled_pickup_time: order.scheduledPickupTime?.getTime(),
      status: order.status,
      created_at: order.createdAt.getTime(),
    };

    await this.kafkaClient.emit('order.created', event);
    this.logger.log(`OrderCreated event published for order ${order.id}`);
  }

  private async publishOrderUpdatedEvent(order: Order): Promise<void> {
    const event = {
      event_id: `order-updated-${order.id}-${Date.now()}`,
      event_timestamp: Date.now(),
      order_id: order.id,
      status: order.status,
      updated_at: order.updatedAt.getTime(),
    };

    await this.kafkaClient.emit('order.updated', event);
    this.logger.log(`OrderUpdated event published for order ${order.id}`);
  }

  private async publishOrderCancelledEvent(order: Order): Promise<void> {
    const event = {
      event_id: `order-cancelled-${order.id}-${Date.now()}`,
      event_timestamp: Date.now(),
      order_id: order.id,
      user_id: order.riderId,
      driver_id: order.driverId,
      status: order.status,
      cancellation_reason: order.cancellationReason,
      cancelled_at: order.cancelledAt?.getTime(),
    };

    await this.kafkaClient.emit('order.cancelled', event);
    this.logger.log(`OrderCancelled event published for order ${order.id}`);
  }

  private async publishOrderExpiredEvent(order: Order): Promise<void> {
    const event = {
      event_id: `order-expired-${order.id}-${Date.now()}`,
      event_timestamp: Date.now(),
      order_id: order.id,
      user_id: order.riderId,
      status: order.status,
      cancelled_at: new Date().getTime(),
    };

    await this.kafkaClient.emit('order.expired', event);
    this.logger.log(`OrderExpired event published for order ${order.id}`);
  }

  private async publishDriverMatchedEvent(order: Order): Promise<void> {
    const event = {
      event_id: `driver-matched-${order.id}-${Date.now()}`,
      event_timestamp: Date.now(),
      order_id: order.id,
      driver_id: order.driverId,
      user_id: order.riderId,
      matched_at: Date.now(),
    };

    await this.kafkaClient.emit('matching.driver.matched', event);
    this.logger.log(`DriverMatched event published for order ${order.id}`);
  }

  private async publishOrderCompletedEvent(order: Order): Promise<void> {
    const event = {
      event_id: `order-completed-${order.id}-${Date.now()}`,
      event_timestamp: Date.now(),
      order_id: order.id,
      user_id: order.riderId,
      driver_id: order.driverId,
      final_fare: order.finalFare,
      completed_at: order.completedAt?.getTime(),
    };

    await this.kafkaClient.emit('order.completed', event);
    this.logger.log(`OrderCompleted event published for order ${order.id}`);
  }
}
