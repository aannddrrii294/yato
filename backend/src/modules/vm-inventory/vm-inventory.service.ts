import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VmInventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId?: string) {
    const where = userId ? { request: { requestedBy: userId } } : {};
    const inventory = await this.prisma.vMInventory.findMany({
      where,
      include: { 
        request: {
          include: { user: true }
        }
      },
    });

    // Auto-repair: If has IP but status is PROVISIONING, it should be RUNNING
    for (const item of inventory) {
      if (item.ipAddress && item.status === 'PROVISIONING') {
        await this.prisma.vMInventory.update({
          where: { id: item.id },
          data: { status: 'RUNNING' }
        });
        item.status = 'RUNNING';
      }
    }

    return inventory.map(item => ({
      id: item.id,
      ticketId: item.request.ticketId,
      hostname: item.request.hostname,
      ip: item.ipAddress || 'PENDING',
      os: item.request.osTemplate,
      cpu: item.request.cpu,
      ram: item.request.ram,
      disk: item.request.disk,
      status: item.status,
      sshUser: item.sshUser,
      sshPassword: item.sshPassword,
      sshPort: item.sshPort,
      environment: item.request.environment,
      requestedBy: item.request.user.fullName,
      notes: item.request.notes,
      createdAt: item.createdAt,
    }));
  }

  async findById(id: string) {
    const item = await this.prisma.vMInventory.findUnique({
      where: { id },
      include: { request: true },
    });
    if (!item) return null;

    return {
      id: item.id,
      hostname: item.request.hostname,
      ip: item.ipAddress || 'PENDING',
      os: item.request.osTemplate,
      cpu: item.request.cpu,
      ram: item.request.ram,
      disk: item.request.disk,
      status: item.status,
      sshUser: item.sshUser,
      createdAt: item.createdAt,
    };
  }

  async delete(id: string) {
    const item = await this.prisma.vMInventory.findUnique({
      where: { id },
    });
    if (!item) return;

    await this.prisma.vMInventory.delete({
      where: { id },
    });

    await this.prisma.vMRequest.update({
      where: { id: item.requestId },
      data: { status: 'FAILED' },
    });

    return { success: true };
  }

  async updateConfig(id: string, data: any) {
    const item = await this.prisma.vMInventory.findUnique({
      where: { id },
      include: { request: true },
    });
    if (!item) return;

    return this.prisma.vMRequest.update({
      where: { id: item.requestId },
      data: {
        cpu: data.cpu,
        ram: data.ram,
        disk: data.disk,
      },
    });
  }
}
