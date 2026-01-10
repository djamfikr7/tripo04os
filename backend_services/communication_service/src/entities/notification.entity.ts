import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum NotificationType {
  ORDER_ASSIGNED = 'ORDER_ASSIGNED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  DRIVER_ARRIVED = 'DRIVER_ARRIVED',
  TRIP_STARTED = 'TRIP_STARTED',
  TRIP_COMPLETED = 'TRIP_COMPLETED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PROMOTION = 'PROMOTION',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  RATING_REQUEST = 'RATING_REQUEST',
  NEW_MESSAGE = 'NEW_MESSAGE',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NotificationDeliveryStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

@Entity('notifications')
@Index(['userId', 'readStatus', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  @Index()
  userId!: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    name: 'notification_type',
  })
  @Index()
  notificationType!: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'jsonb', default: '{}' })
  data!: Record<string, any>;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  @Index()
  priority!: NotificationPriority;

  @Column({
    type: 'enum',
    enum: NotificationDeliveryStatus,
    default: NotificationDeliveryStatus.PENDING,
  })
  @Index()
  deliveryStatus!: NotificationDeliveryStatus;

  @Column({ type: 'boolean', default: false, name: 'read_status' })
  @Index()
  readStatus!: boolean;

  @Column({ type: 'timestamp with time zone', name: 'read_at', nullable: true })
  readAt?: Date;

  @Column({ type: 'timestamp with time zone', name: 'expiry_at', nullable: true })
  @Index()
  expiryAt?: Date;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'action_url' })
  actionUrl?: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  @Index()
  createdAt!: Date;
}
