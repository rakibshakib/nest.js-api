import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/register.dto';

@Controller('api')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register() {
    // return this.authService.register(request);
    return {
      message:
        'Manual registration is disabled, please use the login endpoint instead.',
    };
  }

  @Post('login')
  async login(
    @Body() request: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { email, password } = request;
    const user = await this.authService.login(email, password);

    const { access_token, ...rest } = user;

    response.cookie('access_token', access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return rest;
  }
}
