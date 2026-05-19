import { Module } from '@nestjs/common';
import { ServiceInventoryController } from './service-inventory.controller';
import { ServiceInventoryService } from './service-inventory.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceInventoryController],
  providers: [ServiceInventoryService],
  exports: [ServiceInventoryService],
})
export class ServiceInventoryModule {}
