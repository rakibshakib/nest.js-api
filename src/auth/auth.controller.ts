import {
  Body,
  Controller,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from './dto/password-reset.dto';
import { LoginDto } from './dto/register.dto';
import { ResetTokenGuard } from './reset-token.guard';

@Controller('api/auth')
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

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token');
    return { message: 'Logout successful' };
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestOtp(dto.email);
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.verifyOtp(dto.email, dto.otp);

    response.cookie('reset_token', result.reset_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000,
    });

    return { message: result.message };
  }

  @UseGuards(ResetTokenGuard)
  @Post('reset-password')
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @Request() req: { reset: { sub: number; email: string } },
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.resetPassword(
      req.reset.sub,
      dto.newPassword,
      dto.confirmPassword,
    );

    response.clearCookie('reset_token');

    return result;
  }
}
