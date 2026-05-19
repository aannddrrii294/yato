import { Controller, Get, Delete, Put, Body, Param, UseGuards, Query, Req } from '@nestjs/common';
import { VmInventoryService } from './vm-inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('vm-inventory')
@UseGuards(JwtAuthGuard)
export class VmInventoryController {
  constructor(private vmInventoryService: VmInventoryService) {}

  @Get()
  async findAll(@Query('scope') scope: string, @Req() req: any) {
    const hasAccessToAll = req.user.roles?.some((r: any) => 
      r.role.name === 'ADMIN' || 
      r.role.permissions?.includes('MANAGE_VM_INVENTORY')
    );
    const userId = (scope === 'all' && hasAccessToAll) ? undefined : req.user.id;
    return this.vmInventoryService.findAll(userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.vmInventoryService.delete(id);
  }

  @Put(':id/config')
  async updateConfig(@Param('id') id: string, @Body() data: any) {
    return this.vmInventoryService.updateConfig(id, data);
  }
}
