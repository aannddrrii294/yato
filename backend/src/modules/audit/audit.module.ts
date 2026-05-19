import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditContextService } from '../../common/context/audit-context.service';

@Global()
@Module({
  controllers: [AuditController],
  providers: [AuditService, AuditContextService],
  exports: [AuditService, AuditContextService],
})
export class AuditModule {}
