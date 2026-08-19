import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEnum } from 'class-validator';
import { VendorStatus } from 'generated/prisma/enums';
import { CreateVendorDto } from './create-vendor.dto';

export class UpdateVendorDto extends PartialType(CreateVendorDto) {}

export class UpdateVendorStatusDto {
  @IsBoolean()
  isActive: boolean;
}

export class UpdateVendorApprovalDto {
  @IsEnum(VendorStatus)
  status: VendorStatus;
}
