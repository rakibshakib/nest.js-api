import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { JsonArray, ToNumber } from 'src/common/decorators';

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FLAT = 'FLAT',
}

export class ServiceVariationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @ToNumber()
  @IsNumber()
  @IsPositive()
  price: number;
}

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  shortDescription: string;

  @IsOptional()
  @IsString()
  description?: string;

  @ToNumber()
  @IsNumber()
  @IsPositive()
  basePrice: number;

  @IsOptional()
  @ToNumber()
  @IsNumber()
  @IsPositive()
  discountAmount?: number;

  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ToNumber()
  @IsInt()
  @IsPositive()
  categoryId: number;

  @IsOptional()
  @JsonArray()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceVariationDto)
  variations?: ServiceVariationDto[];
}
