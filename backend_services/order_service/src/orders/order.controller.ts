import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderDto, UpdateOrderStatusDto, CancelOrderDto } from './dto/create-order.dto';
import { Order, OrderStatus, Vertical, RideType } from '../entities/order.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  async createOrder(
    @Request() req,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    const riderId = req.user.id;
    return await this.orderService.createOrder(
      riderId,
      createOrderDto.vertical,
      createOrderDto.product,
      createOrderDto.rideType,
      createOrderDto.pickupLocation,
      createOrderDto.destinationLocation,
      createOrderDto.scheduledPickupTime,
      createOrderDto.items,
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getMyOrders(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ orders: Order[]; total: number }> {
    const riderId = req.user.id;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    return await this.orderService.getRiderOrders(riderId, pageNum, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  async getOrderById(@Param('id') id: string): Promise<Order | null> {
    return await this.orderService.getOrderById(id);
  }

  @Get('status/:status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DRIVER')
  @ApiOperation({ summary: 'Get orders by status' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getOrdersByStatus(
    @Param('status') status: string,
    @Query('limit') limit?: string,
  ): Promise<Order[]> {
    const limitNum = parseInt(limit) || 50;
    return await this.orderService.getOrdersByStatus(status as OrderStatus, limitNum);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update order' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  async updateOrder(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<Order | null> {
    return await this.orderService.updateOrder(id, updateOrderDto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ): Promise<Order | null> {
    return await this.orderService.updateOrderStatus(id, updateStatusDto.status);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  async cancelOrder(
    @Param('id') id: string,
    @Body() cancelOrderDto: CancelOrderDto,
  ): Promise<Order | null> {
    return await this.orderService.cancelOrder(id, cancelOrderDto.reason);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete order' })
  @ApiResponse({ status: 200, description: 'Order deleted successfully' })
  async deleteOrder(@Param('id') id: string): Promise<boolean> {
    return await this.orderService.deleteOrder(id);
  }

  @Get('driver/me')
  @UseGuards(RolesGuard)
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get current driver active orders' })
  @ApiResponse({ status: 200, description: 'Active orders retrieved successfully' })
  async getDriverActiveOrders(@Request() req): Promise<Order[]> {
    const driverId = req.user.id;
    return await this.orderService.getDriverActiveOrders(driverId);
  }

  @Get('driver/me/:status')
  @UseGuards(RolesGuard)
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get current driver orders by status' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getDriverOrdersByStatus(
    @Request() req,
    @Param('status') status: string,
  ): Promise<Order[]> {
    const driverId = req.user.id;
    return await this.orderService.getDriverOrdersByStatus(driverId, status as OrderStatus);
  }

  @Put(':id/assign-driver')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SYSTEM')
  @ApiOperation({ summary: 'Assign driver to order' })
  @ApiResponse({ status: 200, description: 'Driver assigned successfully' })
  async assignDriver(
    @Param('id') id: string,
    @Body() body: { driverId: string },
  ): Promise<Order | null> {
    return await this.orderService.assignDriver(id, body.driverId);
  }
}
