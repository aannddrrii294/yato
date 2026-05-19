import { IsString, IsNotEmpty, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class S3ConfigDto {
  @IsString()
  @IsOptional()
  endpoint?: string;

  @IsString()
  @IsOptional()
  accessKeyId?: string;

  @IsString()
  @IsOptional()
  secretAccessKey?: string;

  @IsString()
  @IsOptional()
  bucket?: string;

  @IsString()
  @IsOptional()
  region?: string;
}

export class GoogleDriveConfigDto {
  @IsString()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  clientSecret?: string;

  @IsString()
  @IsOptional()
  refreshToken?: string;

  @IsString()
  @IsOptional()
  folderId?: string;
}

export class NasConfigDto {
  @IsString()
  @IsOptional()
  path?: string;
}

export class UpdateStorageConfigDto {
  @IsString()
  @IsNotEmpty()
  activeDriver: string; // 'DATABASE' | 'S3' | 'GOOGLE_DRIVE' | 'NAS'

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => S3ConfigDto)
  s3?: S3ConfigDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => GoogleDriveConfigDto)
  googleDrive?: GoogleDriveConfigDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => NasConfigDto)
  nas?: NasConfigDto;
}
