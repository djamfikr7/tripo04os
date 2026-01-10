import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { MessageReceipt } from './message-receipt.entity';

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

export enum MessageType {
  TEXT = 'TEXT',
  LOCATION = 'LOCATION',
  IMAGE = 'IMAGE',
  SYSTEM = 'SYSTEM',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum SenderRole {
  RIDER = 'RIDER',
  DRIVER = 'DRIVER',
  SYSTEM = 'SYSTEM',
}

@Entity('messages')
@Index(['conversationId', 'createdAt'], { unique: false })
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'conversation_id' })
  @Index()
  conversationId!: string;

  @Column({ type: 'uuid', name: 'order_id' })
  @Index()
  orderId!: string;

  @Column({ type: 'uuid', name: 'sender_id' })
  @Index()
  senderId!: string;

  @Column({ type: 'uuid', name: 'receiver_id' })
  @Index()
  receiverId!: string;

  @Column({
    type: 'enum',
    enum: SenderRole,
    name: 'sender_role',
  })
  senderRole!: SenderRole;

  @Column({ type: 'text' })
  content!: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  messageType!: MessageType;

  @Column({ type: 'jsonb', default: '{}' })
  metadata!: Record<string, any>;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT,
  })
  @Index()
  status!: MessageStatus;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  @Index()
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation;

  @OneToMany(() => MessageReceipt, (receipt) => receipt.message)
  receipts!: MessageReceipt[];
}
