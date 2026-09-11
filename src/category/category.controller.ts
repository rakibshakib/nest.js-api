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
import { AdminGuard } from 'src/auth/authAdmin.guard';
import { CurrentUser, QueryPagination } from 'src/common/decorators';
import { imageUploadOptions } from 'src/common/upload/image-upload.util';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  UpdateCategoryDto,
  UpdateCategoryStatusDto,
} from './dto/update-category.dto';

@ApiBearerAuth()
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @UseGuards(AuthenticationGuard, AdminGuard)
  @Post()
  @UseInterceptors(FileInterceptor('image', imageUploadOptions()))
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentUser() user: { sub: number; email: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.categoryService.create(createCategoryDto, user, file);
  }

  @Get()
  findAll(
    @QueryPagination() { page, limit }: { page: number; limit: number },
    @Query('all_services') all_services?: string,
  ) {
    return this.categoryService.findAll(limit, page, all_services === 'true');
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
  }

  @UseGuards(AuthenticationGuard, AdminGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', imageUploadOptions()))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.categoryService.update(id, updateCategoryDto, file);
  }

  @UseGuards(AuthenticationGuard, AdminGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryStatusDto: UpdateCategoryStatusDto,
  ) {
    return this.categoryService.updateStatus(id, updateCategoryStatusDto);
  }

  @UseGuards(AuthenticationGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.remove(id);
  }
}
