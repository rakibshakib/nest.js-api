import { Body, Controller, Post } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';

@Controller('api')
export class AuthController {
  @Post('register')
  register(@Body() request: RegisterDto) {
    return request;
  }
}
