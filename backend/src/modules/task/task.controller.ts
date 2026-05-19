import { Controller, Get, Post, Patch, Delete, Body, UseGuards, Request, Param } from '@nestjs/common';
import { TaskService } from './task.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTaskDto, UpdateTaskDto, CreateTaskCommentDto } from './dto/task.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Get()
  @ApiOperation({ summary: 'Fetch all tasks' })
  async findAll(@Request() req: any) {
    return this.taskService.findAll(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch single task detail' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.taskService.findOne(id, req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  async create(@Body() dto: CreateTaskDto, @Request() req: any) {
    return this.taskService.create(dto, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task properties' })
  async update(@Param('id') id: string, @Body() dto: UpdateTaskDto, @Request() req: any) {
    return this.taskService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete specific task' })
  async delete(@Param('id') id: string) {
    return this.taskService.delete(id);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Post comment to task' })
  async createComment(
    @Param('id') id: string,
    @Body() dto: CreateTaskCommentDto,
    @Request() req: any,
  ) {
    return this.taskService.createComment(id, dto, req.user.id);
  }

  @Post(':id/attachments')
  @ApiOperation({ summary: 'Upload attachment to task' })
  async addAttachment(
    @Param('id') id: string,
    @Body() body: { base64Data: string; filename: string },
    @Request() req: any,
  ) {
    return this.taskService.addAttachment(id, body.base64Data, body.filename, req.user.id);
  }

  @Delete('attachments/:fileId')
  @ApiOperation({ summary: 'Delete task attachment' })
  async removeAttachment(@Param('fileId') fileId: string) {
    return this.taskService.removeAttachment(fileId);
  }
}
