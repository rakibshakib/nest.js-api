import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthenticationGuard } from 'src/auth/auth.guard';
import { CurrentUser, QueryPagination } from 'src/common/decorators';
import { CreateServiceDto } from './dto/create-service.dto';
import {
  UpdateServiceDto,
  UpdateServiceStatusDto,
} from './dto/update-service.dto';
import { ServicesService } from './services.service';

@ApiBearerAuth()
@UseGuards(AuthenticationGuard)
@Controller('api/service')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  create(
    @Body() createServiceDto: CreateServiceDto,
    @CurrentUser('sub') userId: number,
  ) {
    return this.servicesService.create(createServiceDto, userId);
  }

  @Get()
  findAll(@QueryPagination() { page, limit }: { page: number; limit: number }) {
    return this.servicesService.findAll(limit, page);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.remove(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() statusDto: UpdateServiceStatusDto,
  ) {
    return this.servicesService.updateStatus(id, statusDto);
  }
}
