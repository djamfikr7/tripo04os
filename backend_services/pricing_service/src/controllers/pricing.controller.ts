import { Controller, Post, Body, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { PricingService } from '../services/pricing.service';
import { PricingRequest, PricingResponse } from '../models/pricing-request';

@Controller('api/v1/pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('calculate')
  calculatePricing(@Body() request: PricingRequest): PricingResponse {
    try {
      return this.pricingService.calculatePricing(request);
    } catch (error) {
      throw new HttpException(
        `Failed to calculate pricing: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'healthy',
      service: 'pricing-service',
    };
  }

  @Get('ready')
  readinessCheck() {
    return {
      status: 'ready',
      service: 'pricing-service',
    };
  }
}
