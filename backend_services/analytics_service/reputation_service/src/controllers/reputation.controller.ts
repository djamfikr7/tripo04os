import { Controller, Post, Body, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ReputationService, Rating, UserReputation } from '../services/reputation.service';

@Controller('api/v1/reputation')
export class ReputationController {
  constructor(private readonly reputationService: ReputationService) {}

  @Post('ratings')
  addRating(@Body() rating: Omit<Rating, 'id' | 'createdAt'>): Rating {
    try {
      return this.reputationService.addRating(rating);
    } catch (error) {
      throw new HttpException(
        `Failed to add rating: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('ratings/:userId')
  getUserRatings(@Param('userId') userId: string): Rating[] {
    return this.reputationService.getUserRatings(userId);
  }

  @Get('reputation/:userId')
  getUserReputation(@Param('userId') userId: string): UserReputation | null {
    return this.reputationService.getUserReputation(userId);
  }

  @Get('top-users')
  getTopUsers(): UserReputation[] {
    return this.reputationService.getTopUsers();
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'healthy',
      service: 'reputation-service',
    };
  }
}
