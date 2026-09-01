import { IsArray, IsBoolean, IsEnum, IsInt } from 'class-validator';
import { OfferType, VendorStatus } from 'generated/prisma/enums';

import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsStrongPassword,
  ValidateIf,
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

export class VendorOfferDto {
  @IsEnum(OfferType)
  @IsOptional()
  type?: OfferType;

  @ValidateIf((o: VendorOfferDto) => o.type === OfferType.TEXT)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  value?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsBoolean()
  @IsOptional()
  hasExpireDate?: boolean;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateVendorOfferStatusDto {
  @IsBoolean()
  isActive: boolean;
}
