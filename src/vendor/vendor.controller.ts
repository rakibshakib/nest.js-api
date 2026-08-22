import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserType } from 'generated/prisma/enums';
import { AuthenticationGuard } from 'src/auth/auth.guard';
import { AdminGuard } from 'src/auth/authAdmin.guard';
import {
  CreateVendorCategoryDto,
  CreateVendorDto,
} from './dto/create-vendor.dto';
import {
  UpdateVendorApprovalDto,
  UpdateVendorDto,
  UpdateVendorStatusDto,
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
}
