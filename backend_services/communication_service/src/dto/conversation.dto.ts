import { IsUUID, IsEnum, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { VerticalType, ConversationStatus } from '../entities/conversation.entity';

export class CreateConversationDto {
  @IsUUID()
  @IsNotEmpty()
  orderId!: string;

  @IsUUID()
  @IsNotEmpty()
  riderId!: string;

  @IsUUID()
  @IsOptional()
  driverId?: string;

  @IsEnum(VerticalType)
  @IsNotEmpty()
  vertical!: VerticalType;
}

export class UpdateConversationDto {
  @IsEnum(ConversationStatus)
  @IsOptional()
  status?: ConversationStatus;
}

export class GetMessagesDto {
  @IsUUID()
  @IsNotEmpty()
  conversationId!: string;

  @IsOptional()
  limit?: number;

  @IsOptional()
  offset?: number;

  @IsDateString()
  @IsOptional()
  before?: string;
}
