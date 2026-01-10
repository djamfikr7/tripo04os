import { IsUUID, IsString, IsEnum, IsNotEmpty, IsOptional, IsObject, MaxLength } from 'class-validator';
import { SenderRole, MessageType } from '../entities/message.entity';

export class SendMessageDto {
  @IsUUID()
  @IsNotEmpty()
  orderId!: string;

  @IsUUID()
  @IsNotEmpty()
  senderId!: string;

  @IsUUID()
  @IsNotEmpty()
  receiverId!: string;

  @IsEnum(SenderRole)
  @IsNotEmpty()
  senderRole!: SenderRole;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content!: string;

  @IsEnum(MessageType)
  @IsOptional()
  messageType?: MessageType;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class MessageReceiptDto {
  @IsUUID()
  @IsNotEmpty()
  messageId!: string;

  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  deliveryStatus!: 'DELIVERED' | 'READ';

  @IsString()
  @IsOptional()
  deviceId?: string;
}
