import { Module } from '@nestjs/common';
import { HrmController } from './hrm.controller';
import { HrmService } from './hrm.service';
import { HrmSchedulerService } from './hrm-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [HrmController],
  providers: [HrmService, HrmSchedulerService],
  exports: [HrmService],
})
export class HrmModule {}

