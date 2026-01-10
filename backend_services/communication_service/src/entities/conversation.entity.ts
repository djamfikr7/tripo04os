import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Message } from './message.entity';

export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  CLOSED = 'CLOSED',
}

export enum VerticalType {
  RIDE = 'RIDE',
  MOTO = 'MOTO',
  FOOD = 'FOOD',
  GROCERY = 'GROCERY',
  GOODS = 'GOODS',
  TRUCK_VAN = 'TRUCK_VAN',
}

@Entity('conversations')
@Index(['orderId'], { unique: true, where: 'status = "ACTIVE"' })
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'order_id' })
  @Index()
  orderId!: string;

  @Column({ type: 'uuid', name: 'rider_id' })
  @Index()
  riderId!: string;

  @Column({ type: 'uuid', name: 'driver_id', nullable: true })
  @Index()
  driverId?: string;

  @Column({
    type: 'enum',
    enum: VerticalType,
    name: 'vertical',
  })
  vertical!: VerticalType;

  @Column({
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.ACTIVE,
  })
  @Index()
  status!: ConversationStatus;

  @Column({ type: 'timestamp with time zone', name: 'started_at' })
  @Index()
  startedAt!: Date;

  @Column({ type: 'timestamp with time zone', name: 'ended_at', nullable: true })
  endedAt?: Date;

  @Column({ type: 'integer', default: 0, name: 'message_count' })
  messageCount!: number;

  @Column({ type: 'timestamp with time zone', name: 'last_message_at', nullable: true })
  lastMessageAt?: Date;

  @Column({ type: 'text', name: 'last_message_content', nullable: true })
  lastMessageContent?: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Message, (message) => message.conversation)
  messages!: Message[];
}
