import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { VmRequestService } from './vm-request.service';
import { VmRequestController } from './vm-request.controller';
import { VmProvisionWorker } from './workers/vm-provision.worker';
import { IntegrationModule } from '../integration/integration.module';

@Module({
  imports: [
    IntegrationModule,
    BullModule.registerQueue({
      name: 'vm-provisioning',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    }),
  ],
  controllers: [VmRequestController],
  providers: [VmRequestService, VmProvisionWorker],
})
export class VmRequestModule {}
