import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { TaskSchedulerService } from './task-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [TaskController],
  providers: [TaskService, TaskSchedulerService],
  exports: [TaskService, TaskSchedulerService],
})
export class TaskModule {}
