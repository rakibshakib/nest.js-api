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
import { ServicesService } from 'src/services/services.service';
import { UserService } from 'src/user/user.service';
import {
  CreateVendorCategoryDto,
  CreateVendorDto,
} from './dto/create-vendor.dto';
import {
  UpdateVendorApprovalDto,
  UpdateVendorDto,
  UpdateVendorStatusDto,
} from './dto/update-vendor.dto';

@Injectable()
export class VendorService {
  constructor(
    private readonly userService: UserService,
    private readonly serviceService: ServicesService,
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

      const vendor = await tx.vendor.create({
        data: {
          userId: user.id,
          businessName: createVendorDto.businessName,
          address: createVendorDto.address,
          status: VendorStatus.PENDING,
          isActive: false,
        },
      });

      await tx.vendorCategory.createMany({
        data: createVendorDto.categoryIds.map((categoryId) => ({
          vendorId: vendor.userId,
          categoryId,
        })),
      });

      const services = await this.serviceService.findServiceIdsByCategoryIds(
        createVendorDto.categoryIds,
        tx,
      );

      await tx.vendorService.createMany({
        data: services.map((service) => ({
          vendorId: vendor.userId,
          serviceId: service.id,
          isActive: true,
        })),
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
        vendorCategories: {
          include: {
            category: true,
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

  async updateVendorCategory(
    id: number,
    dto: CreateVendorCategoryDto,
    user: { sub: number; userType: UserType },
  ) {
    if (user.sub !== id) {
      throw new ForbiddenException('You are not allowed to update this vendor');
    }

    const categoryIds = [...new Set(dto.categoryIds)];

    if (!categoryIds.length) {
      throw new BadRequestException('At least one category is required');
    }

    // Validate categories
    const categories = await this.prisma.category.findMany({
      where: {
        id: {
          in: categoryIds,
        },
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (categories.length !== categoryIds.length) {
      throw new BadRequestException(
        'One or more categories are invalid or inactive',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Remove all existing categories
      await tx.vendorCategory.deleteMany({
        where: {
          vendorId: id,
        },
      });

      // Add selected categories
      await tx.vendorCategory.createMany({
        data: categoryIds.map((categoryId) => ({
          vendorId: id,
          categoryId,
        })),
      });
    });

    return {
      message: 'Vendor categories updated successfully',
    };
  }

  // find all categories wise all service for a vendor
  async findAllProvidedServices(vendorId: number) {
    const vendor = await this.prisma.vendor.findUnique({
      where: {
        userId: vendorId,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const services = await this.prisma.vendorService.findMany({
      where: {
        vendorId,
        service: {
          isActive: true,
        },
      },
      select: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        isActive: true,
      },
    });

    type Service = (typeof services)[number]['service'];
    type Category = Service['category'];

    type GroupedService = {
      category: Category;
      services: Omit<Service, 'category'>[];
      isActive: boolean;
    };

    const groupedServices = Object.values(
      services.reduce<Record<number, GroupedService>>((acc, vendorService) => {
        const { category, ...service } = vendorService.service;

        if (!acc[category.id]) {
          acc[category.id] = {
            category,
            services: [],
            isActive: vendorService?.isActive ?? false,
          };
        }

        acc[category.id].services.push(service);

        return acc;
      }, {}),
    );

    return {
      message: 'Vendor services fetched successfully',
      content: groupedServices,
    };
  }
}
