import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssetDto {
  @ApiProperty({ example: 'SERVER' })
  @IsString()
  @IsNotEmpty()
  assetType: string; // SERVER, VM, SWITCH, ROUTER, FIREWALL, LAPTOP, STORAGE, ACCESS_POINT, PRINTER, UPS

  @ApiProperty({ example: 'prod-db-srv01', required: false })
  @IsString()
  @IsOptional()
  hostname?: string;

  @ApiProperty({ example: 'SN-129381203', required: false })
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @ApiProperty({ example: 'RECEIVED', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'Datacenter A', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: 'Rack 04B', required: false })
  @IsString()
  @IsOptional()
  rack?: string;

  @ApiProperty({ example: 12, required: false })
  @IsNumber()
  @IsOptional()
  uPosition?: number;

  @ApiProperty({ example: 'uuid-of-user', required: false })
  @IsString()
  @IsOptional()
  ownerId?: string;

  @ApiProperty({ example: {}, required: false })
  @IsOptional()
  metadata?: any;
}

export class UpdateAssetDto {
  @ApiProperty({ example: 'SERVER', required: false })
  @IsString()
  @IsOptional()
  assetType?: string;

  @ApiProperty({ example: 'prod-db-srv01', required: false })
  @IsString()
  @IsOptional()
  hostname?: string;

  @ApiProperty({ example: 'SN-129381203', required: false })
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @ApiProperty({ example: 'ACTIVE', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'Datacenter A', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: 'Rack 04B', required: false })
  @IsString()
  @IsOptional()
  rack?: string;

  @ApiProperty({ example: 12, required: false })
  @IsNumber()
  @IsOptional()
  uPosition?: number;

  @ApiProperty({ example: 'uuid-of-user', required: false })
  @IsString()
  @IsOptional()
  ownerId?: string;

  @ApiProperty({ example: {}, required: false })
  @IsOptional()
  metadata?: any;
}

export class CreateAssetRelationshipDto {
  @ApiProperty({ example: 'uuid-source-asset' })
  @IsString()
  @IsNotEmpty()
  sourceId: string;

  @ApiProperty({ example: 'uuid-target-asset' })
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({ example: 'VM_TO_HYPERVISOR' })
  @IsString()
  @IsNotEmpty()
  type: string;
}

export class CreateAssetMovementDto {
  @ApiProperty({ example: 'Datacenter B' })
  @IsString()
  @IsNotEmpty()
  toLocation: string;

  @ApiProperty({ example: 'Rack 10A', required: false })
  @IsString()
  @IsOptional()
  toRack?: string;

  @ApiProperty({ example: 'Relocation for database migration', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
