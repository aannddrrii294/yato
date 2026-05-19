import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('dashboard')
@Controller('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get platform-wide statistics for the dashboard' })
  async getStats(@Req() req: any) {
    const isAdmin = req.user.roles?.some((r: any) => 
      r.role.name === 'ADMIN' || 
      r.role.permissions?.includes('*')
    );
    const userId = isAdmin ? undefined : req.user.id;
    return this.dashboardService.getStats(userId);
  }
}
