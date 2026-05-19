import { IsString, IsNotEmpty, IsOptional, IsObject, IsInt, Min, Max, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export function IsIpOrHostname(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isIpOrHostname',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // Standard IPv4 or valid domain/hostname format check
          const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
          const hostnameRegex = /^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])(\.([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]))*$/;
          return ipv4Regex.test(value) || hostnameRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} harus berupa format IP Address (IPv4) atau Hostname/Domain yang valid.`;
        }
      },
    });
  };
}

export class CreateServiceRequestDto {
  @ApiProperty({ example: 'Redis-Cache-01' })
  @IsString()
  @IsNotEmpty()
  serviceName: string;

  @ApiProperty({ example: 'Redis Cache' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'Standard' })
  @IsString()
  @IsNotEmpty()
  plan: string;

  @ApiProperty({ example: 'Production' })
  @IsString()
  @IsNotEmpty()
  environment: string;

  @ApiProperty({ example: { version: '7.0' }, required: false })
  @IsObject()
  @IsOptional()
  config?: any;

  @ApiProperty({ example: 'Specific configs...', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 'PENDING', required: false })
  @IsOptional()
  @IsString()
  status?: string;
}

export class ApproveServiceRequestDto {
  @ApiProperty({ example: '10.0.0.1' })
  @IsNotEmpty({ message: 'Address wajib diisi' })
  @IsIpOrHostname()
  address: string;

  @ApiProperty({ example: 6379 })
  @IsNotEmpty({ message: 'Port wajib diisi' })
  @IsInt({ message: 'Port harus berupa angka bulat' })
  @Min(1)
  @Max(65535)
  port: number;

  @ApiProperty({ example: 'admin' })
  @IsString()
  @IsNotEmpty({ message: 'Username wajib diisi' })
  username: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty({ message: 'Password wajib diisi' })
  password: string;
}
