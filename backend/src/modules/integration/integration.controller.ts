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

  @Get('plugins')
  @ApiOperation({ summary: 'Get all custom uploaded integration plugins' })
  async getPlugins() {
    return this.integrationService.getPlugins();
  }

  @Post('plugins/upload')
  @ApiOperation({ summary: 'Upload/Register a custom connector plugin manifest' })
  async uploadPlugin(@Body() dto: any) {
    return this.integrationService.uploadPlugin(dto);
  }

  @Delete('plugins/:key')
  @ApiOperation({ summary: 'Delete/Unregister a custom connector plugin' })
  async deletePlugin(@Param('key') key: string) {
    return this.integrationService.deletePlugin(key);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new integration connection' })
  async create(@Body() dto: any, @Request() req: any) {
    return this.integrationService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active integration connections' })
  async findAll() {
    return this.integrationService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific integration connection detail' })
  async findOne(@Param('id') id: string) {
    return this.integrationService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update specific integration connection' })
  async update(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
    return this.integrationService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete specific integration connection' })
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.integrationService.delete(id, req.user.id);
  }
}
