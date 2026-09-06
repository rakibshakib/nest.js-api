import {
  BadRequestException,
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
import { UserType } from 'generated/prisma/enums';
import { AuthenticationGuard } from 'src/auth/auth.guard';
import { AdminGuard } from 'src/auth/authAdmin.guard';
import {
  CurrentUser,
  QueryPagination,
  type Pagination,
} from 'src/common/decorators';
import {
  CreateVendorCategoryDto,
  CreateVendorDto,
} from './dto/create-vendor.dto';
import {
  ToggleVendorServiceDto,
  UpdateVendorApprovalDto,
  UpdateVendorDto,
  UpdateVendorOfferStatusDto,
  UpdateVendorStatusDto,
  VendorOfferDto,
} from './dto/update-vendor.dto';
import { VendorService } from './vendor.service';

@ApiBearerAuth()
@Controller('api/vendor')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post('register')
  registerVendor(@Body() createVendorDto: CreateVendorDto) {
    return this.vendorService.registerVendor(createVendorDto);
  }

  @UseGuards(AuthenticationGuard)
  @Get()
  findAll(@QueryPagination() { page, limit }: Pagination) {
    return this.vendorService.findAll(page, limit);
  }

  @UseGuards(AuthenticationGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vendorService.findOne(id);
  }

  @UseGuards(AuthenticationGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVendorDto: UpdateVendorDto,
    @CurrentUser() user: { sub: number; userType: UserType },
  ) {
    return this.vendorService.update(id, updateVendorDto, user);
  }

  @UseGuards(AuthenticationGuard, AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vendorService.remove(id);
  }

  @UseGuards(AuthenticationGuard, AdminGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVendorStatusDto,
  ) {
    return this.vendorService.updateStatus(id, dto);
  }

  @UseGuards(AuthenticationGuard, AdminGuard)
  @Patch(':id/approval')
  approval(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVendorApprovalDto,
  ) {
    return this.vendorService.approval(id, dto);
  }

  @UseGuards(AuthenticationGuard)
  @Patch(':id/updateCategory')
  updateVendorCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() categories: CreateVendorCategoryDto,
    @CurrentUser() user: { sub: number; userType: UserType },
  ) {
    return this.vendorService.updateVendorCategory(id, categories, user);
  }

  @UseGuards(AuthenticationGuard, AdminGuard)
  @Get(':id/services')
  getAllProvidedServicesByVendor(
    @Param('id', ParseIntPipe) id: number,
    @QueryPagination() { page, limit }: Pagination,
  ) {
    return this.vendorService.findAllProvidedServices(id, page, limit);
  }

  @UseGuards(AuthenticationGuard, AdminGuard)
  @Patch(':id/services')
  updateServiceStatusForVendor(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ToggleVendorServiceDto,
  ) {
    return this.vendorService.updateServiceStatusForVendor(id, dto);
  }

  // update vendor logo and cover
  @UseGuards(AuthenticationGuard)
  @Patch(':id/logo')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 2 * 1024 * 1024, // 2 MB
      },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  uploadLogo(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { sub: number; userType: UserType },
  ) {
    return this.vendorService.uploadLogo(id, file, user);
  }

  @UseGuards(AuthenticationGuard)
  @Patch(':id/vendor-offers')
  updateVendorOffer(
    @Param('id', ParseIntPipe) id: number,
    @Body() vendorOfferDto: VendorOfferDto,
    @CurrentUser() user: { sub: number; userType: UserType },
  ) {
    return this.vendorService.updateVendorOffer(id, vendorOfferDto, user);
  }
  // delete vendor offer
  @UseGuards(AuthenticationGuard)
  @Delete(':id/vendor-offers')
  deleteVendorOffer(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { sub: number; userType: UserType },
  ) {
    return this.vendorService.deleteVendorOffer(id, user);
  }

  // update status vendor offer
  @UseGuards(AuthenticationGuard)
  @Patch(':id/vendor-offers-status')
  updateVendorOfferStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVendorOfferStatusDto,
    @CurrentUser() user: { sub: number; userType: UserType },
  ) {
    return this.vendorService.updateVendorOfferStatus(id, dto, user);
  }
}
