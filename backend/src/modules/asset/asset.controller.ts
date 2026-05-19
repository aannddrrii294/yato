import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query, Header } from '@nestjs/common';
import { AssetService } from './asset.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateAssetDto, UpdateAssetDto, CreateAssetRelationshipDto } from './dto/asset.dto';
import { LabelGeneratorService } from './services/label-generator.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('assets')
@ApiBearerAuth()
@Controller('assets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AssetController {
  constructor(
    private assetService: AssetService,
    private labelGeneratorService: LabelGeneratorService,
  ) {}

  @Get()
  @Permissions('VIEW_ASSETS')
  @ApiOperation({ summary: 'List all physical assets with search/filters' })
  async findAll(
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.assetService.findAll(search, type, status);
  }

  @Get('scanner/lookup')
  @Permissions('VIEW_ASSETS')
  @ApiOperation({ summary: 'Lookup unique asset details by scan assetCode' })
  async findByCode(@Query('assetCode') assetCode: string) {
    return this.assetService.findByCode(assetCode);
  }

  @Get(':id')
  @Permissions('VIEW_ASSETS')
  @ApiOperation({ summary: 'Get asset details by ID' })
  async findById(@Param('id') id: string) {
    return this.assetService.findById(id);
  }

  @Post()
  @Permissions('MANAGE_ASSETS')
  @ApiOperation({ summary: 'Register a new physical asset' })
  async create(@Body() dto: CreateAssetDto, @Request() req: any) {
    return this.assetService.create(dto, req.user.id);
  }

  @Put(':id')
  @Permissions('MANAGE_ASSETS')
  @ApiOperation({ summary: 'Update physical asset metadata or location' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
    @Request() req: any,
  ) {
    return this.assetService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Permissions('MANAGE_ASSETS')
  @ApiOperation({ summary: 'Soft delete physical asset' })
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.assetService.delete(id, req.user.id);
  }

  // Printable thermal labels HTML renderer
  @Get(':id/print')
  @Permissions('VIEW_ASSETS')
  @Header('Content-Type', 'text/html')
  @ApiOperation({ summary: 'Generate printable A4/thermal Zebra label markup' })
  async printLabel(@Param('id') id: string) {
    const asset = await this.assetService.findById(id);
    return this.labelGeneratorService.generateHtmlLabel({
      assetCode: asset.assetCode,
      assetType: asset.assetType,
      hostname: asset.hostname,
      qrCodeUrl: asset.qrCodeUrl,
    });
  }

  // CMDB Relationships
  @Post('relationship')
  @Permissions('MANAGE_ASSETS')
  @ApiOperation({ summary: 'Create CMDB infrastructure relationship mapping' })
  async addRelationship(
    @Body() dto: CreateAssetRelationshipDto,
    @Request() req: any,
  ) {
    return this.assetService.addRelationship(dto, req.user.id);
  }

  @Get(':id/relationship')
  @Permissions('VIEW_ASSETS')
  @ApiOperation({ summary: 'Get related CMDB assets' })
  async getRelationships(@Param('id') assetId: string) {
    return this.assetService.getRelationships(assetId);
  }

  @Delete('relationship/:id')
  @Permissions('MANAGE_ASSETS')
  @ApiOperation({ summary: 'Delete CMDB relationship' })
  async deleteRelationship(@Param('id') id: string, @Request() req: any) {
    return this.assetService.deleteRelationship(id, req.user.id);
  }

  @Post('export/log')
  @Permissions('VIEW_ASSETS')
  @ApiOperation({ summary: 'Log audit event for exporting asset registry' })
  async logExport(@Request() req: any, @Body('count') count: number) {
    return this.assetService.logExport(req.user.id, count);
  }
}
