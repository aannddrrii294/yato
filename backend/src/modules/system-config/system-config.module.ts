import { Module } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { SystemConfigController } from './system-config.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { CredentialModule } from '../credential/credential.module';
import { VaultController } from './vault.controller';

@Module({
  imports: [PrismaModule, AuditModule, CredentialModule],
  controllers: [SystemConfigController, VaultController],
  providers: [SystemConfigService],
  exports: [SystemConfigService],
})
export class SystemConfigModule {}
