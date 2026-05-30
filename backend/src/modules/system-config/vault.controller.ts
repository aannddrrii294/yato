import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EncryptionService } from '../../common/utils/encryption.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('system-vault')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('MANAGE_CONFIG')
@Controller('system/vault')
export class VaultController {
  constructor(private readonly encryptionService: EncryptionService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get current encryption vault and keys status' })
  async getStatus() {
    return this.encryptionService.getVaultStatus();
  }

  @Post('rotate')
  @ApiOperation({ summary: 'Trigger dynamic DEK key rotation and database re-encryption' })
  async rotate() {
    return this.encryptionService.rotateKey();
  }
}
