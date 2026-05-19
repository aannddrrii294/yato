import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { roles: { include: { role: true } } },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      include: { roles: { include: { role: true } } },
    });
  }

  async updateLastLogin(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
  }

  async update(id: string, data: any) {
    console.log('[DEBUG] Update User Body:', JSON.stringify(data));
    const updateData: any = {};
    const allowedFields = ['email', 'username', 'fullName', 'phoneNumber', 'personalEmail', 'telegramId', 'isMfaEnabled', 'emailNotificationEnabled', 'whatsappNotificationEnabled', 'telegramNotificationEnabled'];
    
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    if (data.isMfaEnabled === false) {
      updateData.mfaSecret = null;
    }

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    if (data.roleIds !== undefined) {
      // First delete existing roles
      await this.prisma.userRole.deleteMany({
        where: { userId: id }
      });
      
      // If there are roles to assign
      if (data.roleIds.length > 0) {
        updateData.roles = {
          create: data.roleIds.map((roleId: string) => ({
            roleId: roleId
          }))
        };
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
