import { Module } from '@nestjs/common';
import { CredentialService } from './credential.service';
import { CredentialController } from './credential.controller';
import { EncryptionService } from '../../common/utils/encryption.service';

@Module({
  controllers: [CredentialController],
  providers: [CredentialService, EncryptionService],
  exports: [CredentialService],
})
export class CredentialModule {}
