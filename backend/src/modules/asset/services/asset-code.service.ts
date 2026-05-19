import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AssetCodeService {
  constructor(private prisma: PrismaService) {}

  private prefixMap: Record<string, string> = {
    SERVER: 'SRV',
    VM: 'VM',
    'VIRTUAL MACHINE': 'VM',
    SWITCH: 'SW',
    ROUTER: 'RTR',
    FIREWALL: 'FW',
    LAPTOP: 'LTP',
    STORAGE: 'STG',
    'ACCESS POINT': 'AP',
    PRINTER: 'PTR',
    UPS: 'UPS',
  };

  private getPrefix(type: string): string {
    const norm = type.toUpperCase().trim();
    return this.prefixMap[norm] || (norm.length >= 3 ? norm.slice(0, 3) : norm.padEnd(3, 'X'));
  }

  async generateCode(type: string): Promise<string> {
    const prefix = this.getPrefix(type);
    
    // Concurrency protection: we lookup the count in the database
    // and if there's a duplicate, we increment until we find a unique one
    let attempt = 0;
    while (attempt < 10) {
      const count = await this.prisma.asset.count({
        where: {
          assetCode: {
            startsWith: `HMS-${prefix}-`,
          },
        },
      });
      
      const nextNumber = count + 1 + attempt;
      const padded = String(nextNumber).padStart(6, '0');
      const candidateCode = `HMS-${prefix}-${padded}`;
      
      // Check if it already exists to be completely secure
      const existing = await this.prisma.asset.findUnique({
        where: { assetCode: candidateCode },
      });
      
      if (!existing) {
        return candidateCode;
      }
      attempt++;
    }
    
    // Absolute fallback
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `HMS-${prefix}-${randomSuffix}`;
  }
}
