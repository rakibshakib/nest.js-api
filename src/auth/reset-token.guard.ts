/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class ResetTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const cookieToken = request.cookies?.reset_token as string | undefined;
    const [type, headerToken] = request.headers.authorization?.split(' ') ?? [];
    const token = cookieToken ?? (type === 'Bearer' ? headerToken : undefined);

    if (!token) {
      throw new UnauthorizedException(
        'Reset token missing, please verify OTP first',
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (payload.purpose !== 'password-reset') {
        throw new UnauthorizedException(
          'Invalid reset token, please verify OTP again',
        );
      }

      request['reset'] = payload;

      return true;
    } catch {
      throw new UnauthorizedException(
        'Reset token expired or invalid, please verify OTP again',
      );
    }
  }
}
