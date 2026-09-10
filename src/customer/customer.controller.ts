import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { UserType } from 'generated/prisma/enums';
import { AuthenticationGuard } from 'src/auth/auth.guard';
import { AdminGuard } from 'src/auth/authAdmin.guard';
import { CurrentUser, QueryPagination } from 'src/common/decorators';
import { CustomerGuard } from './customer.guard';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import {
  UpdateCustomerDto,
  updateCustomerStatusDto,
} from './dto/update-customer.dto';

@ApiBearerAuth()
@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post('signup')
  async create(
    @Body() createCustomerDto: CreateCustomerDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.customerService.create(createCustomerDto);

    response.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return {
      message: 'Customer registered successfully',
      customer: result.customer,
    };
  }

  @UseGuards(AuthenticationGuard, AdminGuard)
  @Get()
  findAll(@QueryPagination() { page, limit }: { page: number; limit: number }) {
    return this.customerService.findAll(limit, page);
  }

  @UseGuards(AuthenticationGuard)
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { sub: number; userType: UserType },
  ) {
    return this.customerService.findOne(id, user);
  }

  @UseGuards(AuthenticationGuard, CustomerGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @CurrentUser() user: { sub: number; userType: UserType },
  ) {
    return this.customerService.update(id, updateCustomerDto, user);
  }

  @UseGuards(AuthenticationGuard)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { sub: number; userType: UserType },
  ) {
    return this.customerService.remove(id, user);
  }

  // toggle customer status to disabled or active
  @UseGuards(AuthenticationGuard, AdminGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: updateCustomerStatusDto,
  ) {
    return this.customerService.updateStatus(id, dto);
  }
}
