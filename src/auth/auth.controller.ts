import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/register.dto';

@Controller('api')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() request: RegisterDto) {
    return this.authService.register(request);
  }

  @Post('login')
  login(@Body() request: LoginDto) {
    const { email, password } = request;
    return this.authService.login(email, password);
  }
}
