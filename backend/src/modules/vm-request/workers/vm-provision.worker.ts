import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IntegrationService } from '../../integration/integration.service';
import axios from 'axios';

@Processor('vm-provisioning', {
  concurrency: parseInt(process.env.VM_PROVISIONING_CONCURRENCY || '3', 10),
})
export class VmProvisionWorker extends WorkerHost {
  private readonly logger = new Logger(VmProvisionWorker.name);

  constructor(
    private prisma: PrismaService,
    private integrationService: IntegrationService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { requestId, hostname, specs } = job.data;
    this.logger.log(`Processing VM provisioning for request: ${requestId} (${hostname})`);

    // Step 1: Update status to PROVISIONING
    await this.prisma.vMRequest.update({
      where: { id: requestId },
      data: { status: 'PROVISIONING' },
    });

    try {
      // Fetch VM Request to check the selected hypervisor
      const vmRequest = await this.prisma.vMRequest.findUnique({
        where: { id: requestId },
      });
      if (!vmRequest) throw new Error(`VM Request ${requestId} not found`);

      const hypervisor = vmRequest.hypervisor; // e.g. "proxmox-ve", "vmware-vsphere", "openstack"
      this.logger.log(`VM request ${requestId} uses hypervisor: ${hypervisor}`);

      // Check if there is an active plugin integration registered for this hypervisor
      const integration = await this.integrationService.findByConnectorKey(hypervisor);

      let ipAddress = '';
      let sshUser = 'yato';
      let sshPassword = '';
      let sshPort = 22;

      if (integration) {
        this.logger.log(`[Plugin Engine] Routing provisioning to dynamic plugin container: ${integration.name} (${integration.endpointUrl})`);
        
        try {
          // Add comment to request thread
          await this.prisma.ticketComment.create({
            data: {
              content: `🔌 <b>[Plugin Engine]</b> Routing automated provisioning to dynamic driver: <b>${integration.name}</b>...`,
              vmRequestId: requestId,
              authorId: vmRequest.requestedBy, // Fallback to requester as author
            }
          });

          // Dispatch provisioning request to dynamic plugin container with 15-second timeout
          const pluginRes = await axios.post(`${integration.endpointUrl}/provision`, {
            requestId,
            ticketId: vmRequest.ticketId,
            hostname,
            specs,
            config: integration.config, // Decrypted credentials/API secrets
          }, { timeout: 15000 });

          this.logger.log(`[Plugin Engine] Plugin responded: ${JSON.stringify(pluginRes.data)}`);

          // Parse result parameters returned by the dynamic plugin
          ipAddress = pluginRes.data?.ipAddress || `10.0.10.${Math.floor(Math.random() * 250) + 10}`;
          sshUser = pluginRes.data?.sshUser || 'yato';
          sshPassword = pluginRes.data?.sshPassword || '';
          sshPort = pluginRes.data?.sshPort ? parseInt(pluginRes.data.sshPort, 10) : 22;

          // Add success comment to ticket thread
          await this.prisma.ticketComment.create({
            data: {
              content: `✅ <b>[Plugin Engine]</b> Dynamic plugin completed provisioning successfully! IP: <code>${ipAddress}</code>, User: <code>${sshUser}</code>.`,
              vmRequestId: requestId,
              authorId: vmRequest.requestedBy,
            }
          });

        } catch (pluginError) {
          const errMsg = pluginError.response?.data?.message || pluginError.message;
          this.logger.error(`[Plugin Engine] Connection error with plugin: ${errMsg}`);
          
          await this.prisma.ticketComment.create({
            data: {
              content: `⚠️ <b>[Plugin Engine Error]</b> Driver <b>${integration.name}</b> failed to provision: <code>${errMsg}</code>. Reverting and failing task.`,
              vmRequestId: requestId,
              authorId: vmRequest.requestedBy,
            }
          });

          throw new Error(`Plugin provision failed: ${errMsg}`);
        }
      } else {
        // Simulation of a Real Hypervisor Call (Fallback if no plugin registered)
        this.logger.log(`No active integration connector found for '${hypervisor}'. Executing built-in simulation...`);
        await this.executeHypervisorCommand(hostname, specs);
        ipAddress = `10.0.10.${Math.floor(Math.random() * 250) + 10}`;
      }

      // Step 2: Update Inventory Record
      await this.prisma.vMInventory.update({
        where: { requestId },
        data: {
          ipAddress,
          sshUser,
          sshPassword,
          sshPort,
          status: 'RUNNING',
        },
      });

      // Step 3: Update status to COMPLETED
      await this.prisma.vMRequest.update({
        where: { id: requestId },
        data: { status: 'COMPLETED' },
      });

      this.logger.log(`VM provisioning completed for ${hostname}. IP Assigned: ${ipAddress}`);
    } catch (error) {
      this.logger.error(`VM provisioning failed for ${requestId}`, error.stack);
      
      await this.prisma.vMRequest.update({
        where: { id: requestId },
        data: { status: 'FAILED' },
      });

      // Also update inventory status
      await this.prisma.vMInventory.update({
        where: { requestId },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  }

  private async executeHypervisorCommand(hostname: string, specs: any) {
    const duration = 5000 + Math.random() * 5000; // 5-10 seconds
    return new Promise((resolve) => setTimeout(resolve, duration));
  }
}
