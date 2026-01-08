import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Rider } from './rider.entity';
import { Driver } from './driver.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  SEARCHING = 'SEARCHING',
  MATCHED = 'MATCHED',
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
  DRIVER_EN_ROUTE = 'DRIVER_EN_ROUTE',
  ARRIVED = 'ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum Vertical {
  RIDE = 'RIDE',
  MOTO = 'MOTO',
  FOOD = 'FOOD',
  GROCERY = 'GROCERY',
  GOODS = 'GOODS',
  TRUCK_VAN = 'TRUCK_VAN',
}

export enum RideType {
  SOLO = 'SOLO',
  SHARED = 'SHARED',
  SCHEDULED = 'SCHEDULED',
  LONG_DISTANCE = 'LONG_DISTANCE',
  CORPORATE = 'CORPORATE',
  WOMEN_ONLY = 'WOMEN_ONLY',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  riderId: string;

  @ManyToOne(() => Rider)
  @JoinColumn({ name: 'rider_id' })
  rider: Rider;

  @Column({ type: 'uuid', nullable: true })
  driverId: string;

  @ManyToOne(() => Driver)
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;

  @Column({ type: 'enum', enum: Vertical })
  vertical: Vertical;

  @Column()
  product: string;

  @Column({ type: 'enum', enum: RideType })
  rideType: RideType;

  @Column({ type: 'geography', spatialFeatureType: 'Point' })
  pickupLocation: string;

  @Column()
  pickupAddress: string;

  @Column({ type: 'geography', spatialFeatureType: 'Point' })
  destinationLocation: string;

  @Column()
  destinationAddress: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledPickupTime: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  estimatedDistanceKm: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  estimatedDurationMinutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  baseFare: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  surgeMultiplier: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalFare: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  finalFare: number;

  @Column({ type: 'enum', enum: OrderStatus })
  status: OrderStatus;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
