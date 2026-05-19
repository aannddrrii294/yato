import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../../common/utils/encryption.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class IntegrationService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private auditService: AuditService,
  ) {}

  private encryptConfig(configObj: any): string {
    if (!configObj) return '';
    const configStr = typeof configObj === 'string' ? configObj : JSON.stringify(configObj);
    return this.encryptionService.encrypt(configStr);
  }

  private decryptConfig(encryptedStr: string): any {
    if (!encryptedStr) return {};
    try {
      const decryptedStr = this.encryptionService.decrypt(encryptedStr);
      return JSON.parse(decryptedStr);
    } catch (e) {
      return {};
    }
  }

  private maskIntegration(integration: any) {
    if (!integration) return null;
    const decrypted = this.decryptConfig(integration.config);
    // Mask sensitive fields in the decrypted config (like passwords, clientSecrets, apiKeys)
    const maskedConfig = { ...decrypted };
    for (const key of Object.keys(maskedConfig)) {
      if (
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('key') ||
        key.toLowerCase().includes('token')
      ) {
        maskedConfig[key] = '****************';
      }
    }
    return {
      ...integration,
      config: maskedConfig,
    };
  }

  async create(data: any, userId: string) {
    const encryptedConfig = this.encryptConfig(data.config || {});
    const integration = await this.prisma.integration.create({
      data: {
        name: data.name,
        type: data.type,
        connectorKey: data.connectorKey,
        endpointUrl: data.endpointUrl,
        authKey: data.authKey || '',
        config: encryptedConfig,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    await this.auditService.log(userId, 'CREATE_INTEGRATION', 'Integration', integration.id);
    return this.maskIntegration(integration);
  }

  async findAll() {
    const integrations = await this.prisma.integration.findMany();
    return integrations.map((item) => this.maskIntegration(item));
  }

  async findOne(id: string) {
    const integration = await this.prisma.integration.findUnique({ where: { id } });
    if (!integration) throw new NotFoundException('Integration not found');
    return this.maskIntegration(integration);
  }

  // Exposed for worker processes - gets fully decrypted connection configurations
  async findByConnectorKey(connectorKey: string) {
    const integration = await this.prisma.integration.findFirst({
      where: { connectorKey, isActive: true },
    });
    if (!integration) return null;
    return {
      ...integration,
      config: this.decryptConfig(integration.config),
    };
  }

  async update(id: string, data: any, userId: string) {
    const existing = await this.prisma.integration.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Integration not found');

    const updateData = { ...data };
    if (data.config) {
      // Re-encrypt config, preserving masked keys if they were not modified
      const decryptedExisting = this.decryptConfig(existing.config);
      const incomingConfig = { ...data.config };
      
      for (const key of Object.keys(incomingConfig)) {
        if (incomingConfig[key] === '****************' && decryptedExisting[key]) {
          incomingConfig[key] = decryptedExisting[key];
        }
      }
      updateData.config = this.encryptConfig(incomingConfig);
    } else {
      delete updateData.config;
    }

    const updated = await this.prisma.integration.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.log(userId, 'UPDATE_INTEGRATION', 'Integration', id);
    return this.maskIntegration(updated);
  }

  async delete(id: string, userId: string) {
    await this.prisma.integration.delete({ where: { id } });
    await this.auditService.log(userId, 'DELETE_INTEGRATION', 'Integration', id);
    return { success: true };
  }
}
