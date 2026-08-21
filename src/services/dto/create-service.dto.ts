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

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FLAT = 'FLAT',
}

export class ServiceVariationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

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

  @IsNumber()
  @IsPositive()
  basePrice: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  discountAmount?: number;

  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @IsInt()
  @IsPositive()
  categoryId: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceVariationDto)
  variations?: ServiceVariationDto[];
}
