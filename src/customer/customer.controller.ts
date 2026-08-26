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
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthenticationGuard } from 'src/auth/auth.guard';
import { AdminGuard } from 'src/auth/authAdmin.guard';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customerService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customerService.update(+id, updateCustomerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customerService.remove(+id);
  }
}
