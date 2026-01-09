import { IsEnum, IsString, IsArray, IsOptional, IsDateString, ValidateNested, IsNumber, IsObject, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { Vertical, RideType } from '../entities/order.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationPoint {
  @ApiProperty({ example: { latitude: 40.7128, longitude: -74.0060 } })
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({ example: { latitude: 40.7128, longitude: -74.0060 } })
  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @ApiProperty({ example: '123 Main St, New York, NY 10001' })
  @IsString()
  @IsNotEmpty()
  address: string;
}

export class OrderItemDto {
  @ApiProperty({ example: 'food_delivery' })
  @IsString()
  @IsNotEmpty()
  itemType: string;

  @ApiProperty({ example: 'Pizza' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Large pizza with extra cheese', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 2, required: false })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiProperty({ example: 15.99, required: false })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty({ example: { special_instructions: 'No onions' }, required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CreateOrderDto {
  @ApiProperty({ enum: Vertical, example: Vertical.RIDE })
  @IsEnum(Vertical)
  @IsNotEmpty()
  vertical: Vertical;

  @ApiProperty({ example: 'standard' })
  @IsString()
  @IsNotEmpty()
  product: string;

  @ApiProperty({ enum: RideType, example: RideType.SOLO })
  @IsEnum(RideType)
  @IsNotEmpty()
  rideType: RideType;

  @ApiProperty({ type: LocationPoint })
  @ValidateNested()
  @IsObject()
  pickupLocation: LocationPoint;

  @ApiProperty({ type: LocationPoint })
  @ValidateNested()
  @IsObject()
  destinationLocation: LocationPoint;

  @ApiProperty({ example: '2026-01-08T15:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  scheduledPickupTime?: Date;

  @ApiProperty({ type: [OrderItemDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  items?: OrderItemDto[];
}

export class UpdateOrderDto {
  @ApiProperty({ example: { metadata: { notes: 'Meeting at airport' } }, required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ example: 20.50, required: false })
  @IsNumber()
  @IsOptional()
  baseFare?: number;

  @ApiProperty({ example: 1.2, required: false })
  @IsNumber()
  @IsOptional()
  surgeMultiplier?: number;

  @ApiProperty({ example: 25.50, required: false })
  @IsNumber()
  @IsOptional()
  totalFare?: number;

  @ApiProperty({ example: 27.00, required: false })
  @IsNumber()
  @IsOptional()
  finalFare?: number;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 'MATCHED', required: true })
  @IsEnum(RideType)
  @IsNotEmpty()
  status: any;
}

export class CancelOrderDto {
  @ApiProperty({ example: 'Driver was too far', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}
