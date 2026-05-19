import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationWorker } from './workers/notification.worker';
import { NotificationGateway } from './notification.gateway';
import { NotificationListener } from './notification.listener';

@Global()
@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService, 
    NotificationWorker, 
    NotificationGateway, 
    NotificationListener
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
