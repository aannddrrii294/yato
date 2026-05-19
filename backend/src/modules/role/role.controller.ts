import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all roles' })
  findAll() {
    return this.roleService.findAll();
  }

  @Get('permissions')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all available permissions' })
  getPermissions() {
    return this.roleService.getAvailablePermissions();
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create custom role' })
  create(@Body() dto: any) {
    return this.roleService.create(dto);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update role' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.roleService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete role' })
  remove(@Param('id') id: string) {
    return this.roleService.delete(id);
  }
}
