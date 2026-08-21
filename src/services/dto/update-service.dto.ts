import { PartialType } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { CreateServiceDto } from './create-service.dto';

export class UpdateServiceDto extends PartialType(CreateServiceDto) {}

export class UpdateServiceStatusDto {
  @IsBoolean()
  isActive: boolean;
}
