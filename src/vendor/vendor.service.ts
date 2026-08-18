import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { UserType, VendorStatus } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

@Injectable()
export class VendorService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async registerVendor(createVendorDto: CreateVendorDto) {
    const existingUser = await this.userService.getUserByEmail(
      createVendorDto.email,
    );

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createVendorDto.password, 10);

    await this.prisma.$transaction(async (tx) => {
      const user = await this.userService.createUser(
        {
          name: createVendorDto.name,
          email: createVendorDto.email,
          password: hashedPassword,
        },
        UserType.VENDOR,
        tx,
      );

      await tx.vendor.create({
        data: {
          userId: user.id,
          businessName: createVendorDto.businessName,
          address: createVendorDto.address,
          status: VendorStatus.PENDING,
          isActive: false,
        },
      });
    });

    return {
      message: 'Vendor registration submitted successfully',
      status: VendorStatus.PENDING,
    };
  }

  findAll() {
    return `This action returns all vendor`;
  }

  findOne(id: number) {
    return `This action returns a #${id} vendor`;
  }

  update(id: number, updateVendorDto: UpdateVendorDto) {
    return `This action updates a #${id} vendor`;
  }

  remove(id: number) {
    return `This action removes a #${id} vendor`;
  }
}
