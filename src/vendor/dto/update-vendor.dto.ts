import { IsArray, IsBoolean, IsEnum, IsInt } from 'class-validator';
import { VendorStatus } from 'generated/prisma/enums';

import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class UpdateVendorDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  businessName?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsStrongPassword()
  password?: string;

  @IsOptional()
  @IsStrongPassword()
  confirmPassword?: string;
}

export class UpdateVendorStatusDto {
  @IsBoolean()
  isActive: boolean;
}

export class UpdateVendorApprovalDto {
  @IsEnum(VendorStatus)
  status: VendorStatus;
}

export class ToggleVendorServiceDto {
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  activeServicesId?: number[];

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  inActiveServicesId?: number[];
}

export class VendorOfferDto {}
