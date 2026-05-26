import { Controller, Get, Post, Put, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('catalog')
@Controller('catalog')
@ApiBearerAuth()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'Get catalog items by category' })
  findAll(@Query('category') category: string) {
    return this.catalogService.findAll(category);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Add a new catalog item' })
  create(@Body() data: any) {
    return this.catalogService.create(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update an existing catalog item' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.catalogService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remove a catalog item' })
  remove(@Param('id') id: string) {
    return this.catalogService.remove(id);
  }
}
