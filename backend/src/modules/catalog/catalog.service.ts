import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async findAll(category?: string) {
    return this.prisma.catalog.findMany({
      where: category ? { category, isActive: true } : { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: any) {
    return this.prisma.catalog.create({ data });
  }

  async remove(id: string) {
    return this.prisma.catalog.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
