import { Module } from '@nestjs/common';
import { CredentialService } from './credential.service';
import { CredentialController } from './credential.controller';
import { EncryptionService } from '../../common/utils/encryption.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CredentialController],
  providers: [CredentialService, EncryptionService],
  exports: [CredentialService, EncryptionService],
})
export class CredentialModule {}
