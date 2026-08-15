import { IsEnum, IsOptional, IsString } from 'class-validator';

enum CategoryStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CategoryStatus)
  @IsOptional()
  status?: CategoryStatus = CategoryStatus.ACTIVE;
}
