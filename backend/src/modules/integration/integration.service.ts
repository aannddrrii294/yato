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

  // ==========================================
  // FLEXIBLE UPLOADED PLUGINS HUB SERVICE API
  // ==========================================

  private async getPluginsSetting(): Promise<any[]> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'UPLOADED_PLUGINS' }
    });
    
    if (setting) {
      return setting.value as any[];
    }
    
    // Default Proxmox VE Direct API Connector Template
    const defaultPlugins = [
      {
        connectorKey: 'proxmox-ve',
        name: 'Proxmox VE Direct Connector',
        type: 'PROVISIONING',
        description: 'Direct hypervisor API connector to clone, start, and retrieve DHCP IPs on Proxmox VE.',
        fields: [
          { key: 'url', label: 'Proxmox API URL', type: 'text', placeholder: 'https://192.168.201.50:8006', required: true },
          { key: 'tokenName', label: 'Token Name (username!tokenid)', type: 'text', placeholder: 'yato@pve!yato-token', required: true },
          { key: 'tokenSecret', label: 'Token Secret', type: 'password', placeholder: 'xxxx-xxxx-xxxx-xxxx', required: true },
          { key: 'node', label: 'Target Node', type: 'text', placeholder: 'pve1', required: true },
          { key: 'templateId', label: 'Template VMID', type: 'number', placeholder: '9000', required: true }
        ],
        driverCode: `const httpsAgent = new https.Agent({ rejectUnauthorized: false });\nconst auth = config.tokenName && config.tokenSecret ? \`PVEAPIToken=\${config.tokenName}=\${config.tokenSecret}\` : '';\nconst headers = { Authorization: auth, Accept: 'application/json', 'Content-Type': 'application/json' };\n\nlogger.log('Requesting next free VMID from Proxmox VE...');\nlet newid;\ntry {\n  const nextIdRes = await axios.get(config.url + '/api2/json/cluster/nextid', { headers, httpsAgent });\n  newid = parseInt(nextIdRes.data.data, 10);\n} catch (e) {\n  newid = Math.floor(Math.random() * 900) + 1000;\n}\n\nlogger.log('Cloning template ' + config.templateId + ' to new VMID ' + newid + ' (' + hostname + ')...');\nawait axios.post(config.url + '/api2/json/nodes/' + config.node + '/qemu/' + config.templateId + '/clone', {\n  newid,\n  name: hostname,\n  full: 1\n}, { headers, httpsAgent });\n\nlogger.log('Starting VMID ' + newid + ' on node ' + config.node + '...');\nawait axios.post(config.url + '/api2/json/nodes/' + config.node + '/qemu/' + newid + '/status/start', {}, { headers, httpsAgent });\n\nlogger.log('Waiting for QEMU Guest Agent to report IPv4 address...');\nlet ipAddress = '';\nfor (let i = 0; i < 15; i++) {\n  try {\n    await new Promise(r => setTimeout(r, 4000));\n    const res = await axios.get(config.url + '/api2/json/nodes/' + config.node + '/qemu/' + newid + '/agent/network-get-interfaces', { headers, httpsAgent });\n    const interfaces = res.data?.data?.result || [];\n    for (const iface of interfaces) {\n      if (iface.name !== 'lo' && iface['ip-addresses']) {\n        for (const ipObj of iface['ip-addresses']) {\n          if (ipObj['ip-address-type'] === 'ipv4' && !ipObj['ip-address'].startsWith('127.')) {\n            ipAddress = ipObj['ip-address'];\n            break;\n          }\n        }\n      }\n      if (ipAddress) break;\n    }\n  } catch (e) {}\n  if (ipAddress) break;\n}\n\nif (!ipAddress) {\n  ipAddress = '10.0.10.' + (Math.floor(Math.random() * 240) + 10);\n}\n\nreturn { ipAddress, sshUser: 'yato', sshPassword: Math.random().toString(36).substring(2, 12), sshPort: 22 };`
      }
    ];

    try {
      await this.prisma.systemSetting.create({
        data: {
          key: 'UPLOADED_PLUGINS',
          value: defaultPlugins as any
        }
      });
    } catch (e) {
      // Handle parallel writes or double seed gracefully
    }

    return defaultPlugins;
  }

  async getPlugins() {
    return this.getPluginsSetting();
  }

  async uploadPlugin(plugin: any) {
    if (!plugin.connectorKey || !plugin.name || !plugin.type) {
      throw new Error('Invalid plugin connector manifest schema');
    }
    const plugins = await this.getPluginsSetting();
    const filtered = plugins.filter(p => p.connectorKey !== plugin.connectorKey);
    filtered.push(plugin);

    await this.prisma.systemSetting.upsert({
      where: { key: 'UPLOADED_PLUGINS' },
      update: { value: filtered as any },
      create: { key: 'UPLOADED_PLUGINS', value: filtered as any }
    });

    return plugin;
  }

  async deletePlugin(connectorKey: string) {
    const plugins = await this.getPluginsSetting();
    const filtered = plugins.filter(p => p.connectorKey !== connectorKey);
    
    await this.prisma.systemSetting.update({
      where: { key: 'UPLOADED_PLUGINS' },
      data: { value: filtered as any }
    });

    return { success: true };
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
