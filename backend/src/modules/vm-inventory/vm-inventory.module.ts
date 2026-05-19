import { Module } from '@nestjs/common';
import { VmInventoryService } from './vm-inventory.service';
import { VmInventoryController } from './vm-inventory.controller';

@Module({
  controllers: [VmInventoryController],
  providers: [VmInventoryService],
  exports: [VmInventoryService],
})
export class VmInventoryModule {}
