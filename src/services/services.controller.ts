import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
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
@Controller('service')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @UseGuards(AuthenticationGuard)
  @Post()
  @UseInterceptors(FileInterceptor('image', imageUploadOptions()))
  create(
    @Body() createServiceDto: CreateServiceDto,
    @CurrentUser('sub') userId: number,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.servicesService.create(createServiceDto, userId, file);
  }

  @UseGuards(AuthenticationGuard)
  @Get()
  findAll(@QueryPagination() { page, limit }: { page: number; limit: number }) {
    return this.servicesService.findAll(limit, page);
  }

  @Get('for-customer')
  findForCustomer(
    @QueryPagination() { page, limit }: { page: number; limit: number },
    @Query('most_rated') mostRated?: string,
    @Query('most_ordered') mostOrdered?: string,
    @Query('has_discount') hasDiscount?: string,
  ) {
    return this.servicesService.findForCustomer(
      {
        mostRated: mostRated === 'true',
        mostOrdered: mostOrdered === 'true',
        hasDiscount: hasDiscount === 'true',
      },
      limit,
      page,
    );
  }

  @UseGuards(AuthenticationGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findOne(id);
  }

  @UseGuards(AuthenticationGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', imageUploadOptions()))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateServiceDto: UpdateServiceDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.servicesService.update(id, updateServiceDto, file);
  }

  @UseGuards(AuthenticationGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.remove(id);
  }

  @UseGuards(AuthenticationGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() statusDto: UpdateServiceStatusDto,
  ) {
    return this.servicesService.updateStatus(id, statusDto);
  }
}
