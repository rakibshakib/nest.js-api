import { OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  ValidateNested,
} from 'class-validator';
import { JsonArray, ToBoolean, ToNumber } from 'src/common/decorators';
import { CreateServiceDto, ServiceVariationDto } from './create-service.dto';

export class UpdateServiceVariantDto extends ServiceVariationDto {
  @IsOptional()
  @ToNumber()
  @IsInt()
  @IsPositive()
  id?: number;
}

export class UpdateServiceDto extends PartialType(
  OmitType(CreateServiceDto, ['variations'] as const),
) {
  @IsOptional()
  @JsonArray()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateServiceVariantDto)
  variations?: UpdateServiceVariantDto[];
}

export class UpdateServiceStatusDto {
  @ToBoolean()
  @IsBoolean()
  isActive: boolean;
}
