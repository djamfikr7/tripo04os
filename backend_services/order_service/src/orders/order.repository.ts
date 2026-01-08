import { Injectable, In } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(order: Partial<Order>): Promise<Order> {
    const newOrder = this.orderRepository.create(order);
    return await this.orderRepository.save(newOrder);
  }

  async findById(id: string): Promise<Order | null> {
    return await this.orderRepository.findOne({
      where: { id },
      relations: ['rider', 'driver', 'items'],
    });
  }

  async findByRiderId(riderId: string, limit = 10, offset = 0): Promise<[Order[], number]> {
    const [orders, count] = await this.orderRepository.findAndCount({
      where: { riderId },
      relations: ['rider', 'driver', 'items'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return [orders, count];
  }

  async findByStatus(status: OrderStatus, limit = 50): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { status },
      relations: ['rider', 'driver', 'items'],
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  async update(id: string, updates: Partial<Order>): Promise<Order | null> {
    await this.orderRepository.update(id, updates);
    return await this.findById(id);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    await this.orderRepository.update(id, { status });
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.orderRepository.softDelete(id);
    return result.affected > 0;
  }

  async findPendingOrdersExpiringBefore(date: Date, limit = 50): Promise<Order[]> {
    return await this.orderRepository
      .createQueryBuilder('order')
      .where('order.status = :status', { status: OrderStatus.PENDING })
      .andWhere('(order.scheduledPickupTime IS NULL OR order.scheduledPickupTime < :date)', { date })
      .leftJoinAndSelect('order.scheduledPickupTime', 'scheduledPickupTime')
      .orderBy('order.createdAt', 'ASC')
      .take(limit)
      .getMany();
  }

  async findActiveOrdersByDriverId(driverId: string): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { 
        driverId,
        status: In([OrderStatus.MATCHED, OrderStatus.DRIVER_ASSIGNED, OrderStatus.DRIVER_EN_ROUTE, OrderStatus.ARRIVED, OrderStatus.IN_PROGRESS])
      },
      relations: ['rider', 'driver', 'items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByDriverIdAndStatus(driverId: string, status: OrderStatus): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { driverId, status },
      relations: ['rider', 'driver', 'items'],
      order: { createdAt: 'DESC' },
    });
  }
}
