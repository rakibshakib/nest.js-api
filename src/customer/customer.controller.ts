import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { UserType } from 'generated/prisma/enums';
import { AuthenticationGuard } from 'src/auth/auth.guard';
import { AdminGuard } from 'src/auth/authAdmin.guard';
import { CustomerGuard } from './customer.guard';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import {
  UpdateCustomerDto,
  updateCustomerStatusDto,
} from './dto/update-customer.dto';

@ApiBearerAuth()
@Controller('api/customer')
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
  findAll(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.customerService.findAll(limit, page);
  }

  @UseGuards(AuthenticationGuard)
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { sub: number; userType: UserType } },
  ) {
    return this.customerService.findOne(id, req.user);
  }

  @UseGuards(AuthenticationGuard, CustomerGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @Request() req: { user: { sub: number; userType: UserType } },
  ) {
    return this.customerService.update(id, updateCustomerDto, req.user);
  }

  @UseGuards(AuthenticationGuard)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { sub: number; userType: UserType } },
  ) {
    return this.customerService.remove(id, req.user);
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
