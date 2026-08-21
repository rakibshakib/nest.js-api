import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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
          phone: createVendorDto.phone,
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

  async findOne(id: number) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { userId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const { user, ...rest } = vendor;
    return {
      ...rest,
      name: user.name,
      email: user.email,
      phone: user.phone,
    };
  }

  async update(
    id: number,
    dto: UpdateVendorDto,
    user: { sub: number; userType: UserType },
  ) {
    if (!dto || Object.keys(dto).length === 0) {
      throw new BadRequestException('At least one field is required to update');
    }

    const isAdmin = user.userType === UserType.ADMIN;
    const isOwner = user.sub === id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You are not allowed to update this vendor');
    }

    const { name, businessName, address, phone, password, confirmPassword } =
      dto || {};

    // Password validation
    if ((password && !confirmPassword) || (!password && confirmPassword)) {
      throw new BadRequestException(
        'Password and confirm password are both required',
      );
    }

    if (password && password !== confirmPassword) {
      throw new BadRequestException(
        'Password and confirm password do not match',
      );
    }

    const userData: {
      name?: string;
      phone?: string;
      password?: string;
    } = {};

    const vendorData: {
      businessName?: string;
      address?: string;
    } = {};

    if (name) userData.name = name;
    if (phone) userData.phone = phone;

    if (businessName) vendorData.businessName = businessName;
    if (address) vendorData.address = address;

    if (password) {
      userData.password = await bcrypt.hash(password, 10);
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        if (Object.keys(userData).length) {
          await this.userService.updateUser(id, userData, tx);
        }

        if (Object.keys(vendorData).length) {
          await tx.vendor.update({
            where: { userId: id },
            data: vendorData,
          });
        }
      });

      return {
        message: 'Vendor updated successfully',
      };
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Vendor not found');
      }

      throw new InternalServerErrorException('Failed to update vendor');
    }
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
