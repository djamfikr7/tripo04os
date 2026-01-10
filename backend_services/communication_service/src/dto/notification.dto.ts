import { IsUUID, IsEnum, IsNotEmpty, IsString, MaxLength, IsObject, IsOptional, IsDateString } from 'class-validator';
import {
  NotificationType,
  NotificationPriority,
} from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @IsEnum(NotificationType)
  @IsNotEmpty()
  notificationType!: NotificationType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsString()
  @IsOptional()
  actionUrl?: string;

  @IsDateString()
  @IsOptional()
  expiryAt?: string;
}

export class MarkNotificationReadDto {
  @IsUUID()
  @IsNotEmpty()
  notificationId!: string;
}

export class GetNotificationsDto {
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsOptional()
  unreadOnly?: boolean;

  @IsOptional()
  limit?: number;

  @IsOptional()
  offset?: number;
}
