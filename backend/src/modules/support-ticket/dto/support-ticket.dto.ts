import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateSupportTicketDto {
  @ApiProperty({ example: 'Network issues in Production' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'We are experiencing slow connectivity to the main database.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'HIGH', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] })
  @IsEnum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  @IsOptional()
  priority?: string;

  @ApiProperty({ example: 'INFRASTRUCTURE' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: ['network', 'slow'] })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ example: ['base64_data_here'] })
  @IsOptional()
  attachments?: string[];

  @ApiProperty({ example: 'OPEN', required: false })
  @IsOptional()
  @IsString()
  status?: string;
}
