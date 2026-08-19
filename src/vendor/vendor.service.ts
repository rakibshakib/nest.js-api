import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import bcrypt from 'bcrypt';
import { UserType, VendorStatus } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import {
  UpdateVendorApprovalDto,
  UpdateVendorDto,
  UpdateVendorStatusDto,
} from './dto/update-vendor.dto';

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

  async findAll() {
    const vendors = await this.prisma.vendor.findMany({
      select: {
        userId: true,
        businessName: true,
        address: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,

        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return vendors.map(({ user, ...vendor }) => ({
      ...vendor,
      name: user.name,
      email: user.email,
      phone: user.phone,
    }));
  }

  findOne(id: number) {
    return `This action returns a #${id} vendor`;
  }

  update(id: number, updateVendorDto: UpdateVendorDto) {
    return `This action updates a #${id} vendor`;
  }

  async remove(id: number) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const vendor = await tx.vendor.delete({
          where: { userId: id },
        });

        await tx.user.delete({
          where: { id },
        });

        return vendor;
      });

      return {
        message: 'Vendor deleted successfully',
        content: result,
      };
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Vendor not found');
      }

      throw new InternalServerErrorException('Failed to delete vendor');
    }
  }

  // approve / reject vendor
  async approval(id: number, dto: UpdateVendorApprovalDto) {
    console.log(dto);
    try {
      const vendor = await this.prisma.vendor.update({
        where: {
          userId: id,
        },
        data: {
          status: dto.status,
          isActive: dto.status === VendorStatus.APPROVED,
        },
      });

      return {
        message: `Vendor ${dto.status.toLowerCase()} successfully`,
        content: vendor,
      };
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Vendor not found');
      }

      throw new InternalServerErrorException(
        'Failed to update vendor approval status',
      );
    }
  }

  async updateStatus(id: number, dto: UpdateVendorStatusDto) {
    try {
      const vendor = await this.prisma.vendor.update({
        where: {
          userId: id,
        },
        data: {
          isActive: dto.isActive,
        },
      });

      return {
        message: 'Vendor status updated successfully',
        content: vendor,
      };
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Vendor not found');
      }

      throw new InternalServerErrorException('Failed to update vendor status');
    }
  }
}
