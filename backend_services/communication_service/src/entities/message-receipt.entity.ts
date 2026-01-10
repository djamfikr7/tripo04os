import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Message } from './message.entity';

export enum DeliveryStatus {
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

@Entity('message_receipts')
@Unique(['messageId', 'userId'])
export class MessageReceipt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'message_id' })
  @Index()
  messageId!: string;

  @Column({ type: 'uuid', name: 'user_id' })
  @Index()
  userId!: string;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    name: 'delivery_status',
  })
  @Index()
  deliveryStatus!: DeliveryStatus;

  @Column({ type: 'timestamp with time zone', name: 'delivered_at', nullable: true })
  @Index()
  deliveredAt?: Date;

  @Column({ type: 'timestamp with time zone', name: 'read_at', nullable: true })
  @Index()
  readAt?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'device_id' })
  deviceId?: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Message, (message) => message.receipts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'message_id' })
  message!: Message;
}
