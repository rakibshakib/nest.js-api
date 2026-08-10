import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  async getUserByEmail(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email },
    });
    return user;
  }

  // create user
  async createUser(email: string, password: string, name: string) {
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password,
      },
    });
    return user;
  }
}
