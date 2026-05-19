import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  taskType?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assigneeIds?: string[];

  @IsOptional()
  checklist?: any;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  followers?: string[];
}

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  taskType?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assigneeIds?: string[];

  @IsOptional()
  checklist?: any;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  followers?: string[];
}

export class CommentAttachmentDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  base64Data: string;
}

export class CreateTaskCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CommentAttachmentDto)
  attachments?: CommentAttachmentDto[];
}
