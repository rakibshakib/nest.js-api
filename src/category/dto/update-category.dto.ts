import { PartialType } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class UpdateCategoryStatusDto {
  @IsBoolean()
  isActive: boolean;
}
