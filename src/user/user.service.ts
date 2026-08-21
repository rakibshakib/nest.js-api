import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { UserType } from 'generated/prisma/enums';
import { RegisterDto } from 'src/auth/dto/register.dto';
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

  async getUserForLogin(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        vendor: true,
        admin: true,
        customer: true,
      },
    });
  }

  async getUserInfoByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  }

  // create user
  async createUser(
    request: RegisterDto,
    userType: UserType = UserType.CUSTOMER,
    tx?: Prisma.TransactionClient,
  ) {
    const { email, password, name, phone } = request;

    const prisma = tx ?? this.prisma;

    return prisma.user.create({
      data: {
        name,
        email,
        password,
        userType,
        phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        userType: true,
      },
    });
  }

  async updateUser(
    id: number,
    data: {
      name?: string;
      phone?: string;
      password?: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prisma;

    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        userType: true,
      },
    });
  }
}
