import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserType } from 'generated/prisma/enums';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user: { userType: UserType };
    }>();

    console.log('AdminGuard user:', request.user);

    return request.user.userType === UserType.ADMIN;
  }
}
