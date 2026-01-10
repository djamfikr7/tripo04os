import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gateway } from './gateway/communication.gateway';
import { CommunicationService } from './services/communication.service';
import { CommunicationController } from './controllers/communication.controller';
import {
  Conversation,
  Message,
  MessageReceipt,
  Notification,
} from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME', 'tripo04os_communication'),
        entities: [Conversation, Message, MessageReceipt, Notification],
        synchronize: configService.get('DATABASE_SYNCHRONIZE', 'false'),
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production'
          ? { rejectUnauthorized: false }
          : false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Conversation, Message, MessageReceipt, Notification]),
  ],
  controllers: [CommunicationController],
  providers: [Gateway, CommunicationService],
})
export class AppModule {}
