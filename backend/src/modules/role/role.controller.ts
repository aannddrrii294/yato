import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @Permissions('MANAGE_ROLES')
  @ApiOperation({ summary: 'Get all roles' })
  findAll() {
    return this.roleService.findAll();
  }

  @Get('permissions')
  @Permissions('MANAGE_ROLES')
  @ApiOperation({ summary: 'Get all available permissions' })
  getPermissions() {
    return this.roleService.getAvailablePermissions();
  }

  @Post()
  @Permissions('MANAGE_ROLES')
  @ApiOperation({ summary: 'Create custom role' })
  create(@Body() dto: any) {
    return this.roleService.create(dto);
  }

  @Put(':id')
  @Permissions('MANAGE_ROLES')
  @ApiOperation({ summary: 'Update role' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.roleService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('MANAGE_ROLES')
  @ApiOperation({ summary: 'Delete role' })
  remove(@Param('id') id: string) {
    return this.roleService.delete(id);
  }
}
