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
  Request,
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
  CreateVendorCategoryDto,
  CreateVendorDto,
} from './dto/create-vendor.dto';
import {
  ToggleVendorServiceDto,
  UpdateVendorApprovalDto,
  UpdateVendorDto,
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
  findAll() {
    return this.vendorService.findAll();
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
    @Request() req: { user: { sub: number; userType: UserType } },
  ) {
    return this.vendorService.update(id, updateVendorDto, req.user);
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
    @Request() req: { user: { sub: number; userType: UserType } },
  ) {
    return this.vendorService.updateVendorCategory(id, categories, req.user);
  }

  @UseGuards(AuthenticationGuard, AdminGuard)
  @Get(':id/services')
  getAllProvidedServicesByVendor(@Param('id', ParseIntPipe) id: number) {
    return this.vendorService.findAllProvidedServices(id);
  }

  @UseGuards(AuthenticationGuard, AdminGuard)
  @Patch(':id/services')
  updateServiceStatusForVendor(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ToggleVendorServiceDto,
  ) {
    console.log(dto, 'controller');

    return this.vendorService.updateServiceStatusForVendor(id, dto);
  }

  // update vendor logo and cover
  @UseGuards(AuthenticationGuard)
  @Patch(':id/logo')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 2 * 1024 * 1024, // 5 MB
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
  ) {
    return this.vendorService.uploadLogo(id, file);
  }

  @UseGuards(AuthenticationGuard)
  @Patch(':id/vendor-offers')
  updateVendorOffer(
    @Param('id', ParseIntPipe) id: number,
    @Body() vendorOfferDto: VendorOfferDto,
    @Request() req: { user: { sub: number; userType: UserType } },
  ) {
    return this.vendorService.updateVendorOffer(id, vendorOfferDto, req.user);
  }
}
