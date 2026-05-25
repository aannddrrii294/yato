import { Module, forwardRef } from '@nestjs/common';
import { CredentialService } from './credential.service';
import { CredentialController } from './credential.controller';
import { EncryptionService } from '../../common/utils/encryption.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [CredentialController],
  providers: [CredentialService, EncryptionService],
  exports: [CredentialService, EncryptionService],
})
export class CredentialModule {}
