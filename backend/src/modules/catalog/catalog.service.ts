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

  async update(id: string, data: any) {
    return this.prisma.catalog.update({
      where: { id },
      data: {
        name: data.name,
        value: data.value,
        description: data.description,
        metadata: data.metadata,
        category: data.category,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.catalog.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
