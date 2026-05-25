import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
  Delete,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceRequestService } from './service-request.service';
import { CreateServiceRequestDto, ApproveServiceRequestDto } from './dto/service-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('service-requests')
@Controller('service/request')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ServiceRequestController {
  constructor(private readonly serviceRequestService: ServiceRequestService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service request' })
  create(@Body() dto: CreateServiceRequestDto, @Req() req: any) {
    return this.serviceRequestService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all service requests (filtered by user access)' })
  findAll(@Req() req: any) {
    return this.serviceRequestService.findAll(req.user);
  }

  @Post(':id/followers')
  @ApiOperation({ summary: 'Add a follower to a service request' })
  async addFollower(@Param('id') id: string, @Body('userId') userId: string) {
    return this.serviceRequestService.addFollower(id, userId);
  }

  @Delete(':id/followers/:userId')
  @ApiOperation({ summary: 'Remove a follower from a service request' })
  async removeFollower(@Param('id') id: string, @Param('userId') userId: string) {
    return this.serviceRequestService.removeFollower(id, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service request detail' })
  findOne(@Param('id') id: string) {
    return this.serviceRequestService.findOne(id);
  }

  @Put(':id/approve')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Approve a service request' })
  approve(@Param('id') id: string, @Req() req: any, @Body() dto: ApproveServiceRequestDto) {
    return this.serviceRequestService.approve(id, req.user.id, dto);
  }

  @Put(':id/reject')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Reject a service request' })
  reject(@Param('id') id: string, @Req() req: any, @Body('reason') reason: string) {
    return this.serviceRequestService.reject(id, req.user.id, reason);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a service request' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateServiceRequestDto>, @Req() req: any) {
    return this.serviceRequestService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a service request (Admin only)' })
  deleteRequest(@Param('id') id: string, @Req() req: any) {
    return this.serviceRequestService.deleteRequest(id, req.user.id);
  }
}
