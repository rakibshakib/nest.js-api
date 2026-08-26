import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserType } from 'generated/prisma/enums';

@Injectable()
export class CustomerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user: { userType: UserType };
    }>();

    return request.user.userType === UserType.CUSTOMER;
  }
}
