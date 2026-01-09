import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Gateway } from './gateway/communication.gateway';

@Module({
  imports: [ConfigModule.forRoot()],
  providers: [Gateway],
})
export class AppModule {}
