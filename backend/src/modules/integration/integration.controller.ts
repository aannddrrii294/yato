import { Controller, Get, Post, Put, Delete, Body, UseGuards, Request, Param } from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('integrations')
@ApiBearerAuth()
@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationController {
  constructor(private integrationService: IntegrationService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new integration plugin' })
  async create(@Body() dto: any, @Request() req: any) {
    return this.integrationService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active integration plugins' })
  async findAll() {
    return this.integrationService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific integration plugin detail' })
  async findOne(@Param('id') id: string) {
    return this.integrationService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update specific integration plugin' })
  async update(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
    return this.integrationService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete specific integration plugin' })
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.integrationService.delete(id, req.user.id);
  }
}
