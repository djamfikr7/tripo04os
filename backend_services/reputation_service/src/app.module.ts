import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReputationController } from './controllers/reputation.controller';
import { ReputationService } from './services/reputation.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [ReputationController],
  providers: [ReputationService],
  exports: [ReputationService],
})
export class AppModule {}
