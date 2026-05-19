import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServiceInventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId?: string) {
    const where = userId ? { request: { requestedBy: userId } } : {};
    const items = await this.prisma.serviceInventory.findMany({
      where,
      include: { 
        request: {
          include: { user: true }
        }
      },
    });
    
    return items.map(item => ({
      id: item.id,
      ticketId: item.request.ticketId,
      serviceName: item.request.serviceName,
      version: item.request.version,
      environment: item.request.environment,
      endpoint: item.endpoint,
      address: item.address,
      port: item.port,
      username: item.username,
      password: item.password,
      status: item.status,
      requestedBy: item.request.user.fullName,
      createdAt: item.createdAt,
    }));
  }

  async findByRequestId(requestId: string) {
    const item = await this.prisma.serviceInventory.findUnique({
      where: { requestId },
      include: { request: true },
    });
    if (!item) throw new NotFoundException('Service inventory item not found');
    
    return {
      id: item.id,
      serviceName: item.request.serviceName,
      version: item.request.version,
      environment: item.request.environment,
      endpoint: item.endpoint,
      address: item.address,
      port: item.port,
      username: item.username,
      password: item.password,
      status: item.status,
      createdAt: item.createdAt,
    };
  }

  async update(id: string, data: any) {
    const item = await this.prisma.serviceInventory.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Service inventory item not found');

    return this.prisma.serviceInventory.update({
      where: { id },
      data: {
        address: data.address,
        port: data.port,
        username: data.username,
        password: data.password,
        endpoint: data.endpoint,
        status: data.status || 'COMPLETED',
      },
    });
  }
}
