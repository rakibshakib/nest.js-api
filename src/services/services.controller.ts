import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthenticationGuard } from 'src/auth/auth.guard';
import { CurrentUser, QueryPagination } from 'src/common/decorators';
import { imageUploadOptions } from 'src/common/upload/image-upload.util';
import { CreateServiceDto } from './dto/create-service.dto';
import {
  UpdateServiceDto,
  UpdateServiceStatusDto,
} from './dto/update-service.dto';
import { ServicesService } from './services.service';

@ApiBearerAuth()
@UseGuards(AuthenticationGuard)
@Controller('service')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image', imageUploadOptions()))
  create(
    @Body() createServiceDto: CreateServiceDto,
    @CurrentUser('sub') userId: number,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.servicesService.create(createServiceDto, userId, file);
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
  @UseInterceptors(FileInterceptor('image', imageUploadOptions()))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateServiceDto: UpdateServiceDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.servicesService.update(id, updateServiceDto, file);
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
