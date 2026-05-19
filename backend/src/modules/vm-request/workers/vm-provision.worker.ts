import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('vm-provisioning', {
  concurrency: parseInt(process.env.VM_PROVISIONING_CONCURRENCY || '3', 10),
})
export class VmProvisionWorker extends WorkerHost {
  private readonly logger = new Logger(VmProvisionWorker.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { requestId, hostname, specs } = job.data;
    this.logger.log(`Processing VM provisioning for request: ${requestId} (${hostname})`);

    try {
      // Step 1: Update status to PROVISIONING
      await this.prisma.vMRequest.update({
        where: { id: requestId },
        data: { status: 'PROVISIONING' },
      });

      // Simulation of a Real Hypervisor Call (e.g., Proxmox/VMware)
      this.logger.log(`[Hypervisor] Creating VM ${hostname} with ${specs.cpu} CPU, ${specs.ram}GB RAM...`);
      await this.executeHypervisorCommand(hostname, specs);

      // Step 2: Update Inventory Record
      const ipAddress = `10.0.10.${Math.floor(Math.random() * 250) + 10}`;
      await this.prisma.vMInventory.update({
        where: { requestId },
        data: {
          ipAddress,
          sshUser: 'yato',
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
    // This is where real API calls to Proxmox, VMware, or Cloud providers would go.
    // For now, we simulate the latency of a real provisioning operation.
    const duration = 5000 + Math.random() * 5000; // 5-10 seconds
    return new Promise((resolve) => setTimeout(resolve, duration));
  }
}
