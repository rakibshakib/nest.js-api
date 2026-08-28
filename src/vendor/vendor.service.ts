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
import { CategoryService } from 'src/category/category.service';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import { PrismaService } from 'src/prisma.service';
import { ServicesService } from 'src/services/services.service';
import { UserService } from 'src/user/user.service';
import {
  CreateVendorCategoryDto,
  CreateVendorDto,
} from './dto/create-vendor.dto';
import {
  ToggleVendorServiceDto,
  UpdateVendorApprovalDto,
  UpdateVendorDto,
  UpdateVendorStatusDto,
} from './dto/update-vendor.dto';

@Injectable()
export class VendorService {
  constructor(
    private readonly userService: UserService,
    private readonly serviceService: ServicesService,
    private readonly categoryService: CategoryService,
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
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

    console.log({ categoryIds });

    if (!categoryIds.length) {
      throw new BadRequestException('At least one category is required');
    }

    const categories = await this.categoryService.filterCategories(categoryIds);

    if (categories.length !== categoryIds.length) {
      throw new BadRequestException(
        'One or more categories are invalid or inactive',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Update vendor categories
      await tx.vendorCategory.deleteMany({
        where: {
          vendorId: id,
        },
      });

      await tx.vendorCategory.createMany({
        data: categoryIds.map((categoryId) => ({
          vendorId: id,
          categoryId,
        })),
      });

      // Get services belonging to selected categories
      const services = await this.serviceService.findServiceIdsByCategoryIds(
        categoryIds,
        tx,
      );
      console.log({ services });
      const serviceIds = services.map((service) => service.id);

      // Remove services that are no longer part of selected categories
      await tx.vendorService.deleteMany({
        where: {
          vendorId: id,
          serviceId: {
            notIn: serviceIds,
          },
        },
      });

      // Get already assigned services
      const existingServices = await tx.vendorService.findMany({
        where: {
          vendorId: id,
          serviceId: {
            in: serviceIds,
          },
        },
        select: {
          serviceId: true,
        },
      });

      const existingServiceIds = new Set(
        existingServices.map((service) => service.serviceId),
      );

      // Add only new services
      const newServices = services.filter(
        (service) => !existingServiceIds.has(service.id),
      );

      if (newServices.length) {
        await tx.vendorService.createMany({
          data: newServices.map((service) => ({
            vendorId: id,
            serviceId: service.id,
            isActive: true,
          })),
        });
      }
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
      services: (Omit<Service, 'category'> & {
        isActive: boolean;
      })[];
    };

    const groupedServices = Object.values(
      services.reduce<Record<number, GroupedService>>((acc, vendorService) => {
        const { category, ...service } = vendorService.service;

        if (!acc[category.id]) {
          acc[category.id] = {
            category,
            services: [],
          };
        }

        acc[category.id].services.push({
          ...service,
          isActive: vendorService?.isActive ?? false,
        });

        return acc;
      }, {}),
    );

    return {
      message: 'Vendor services fetched successfully',
      content: groupedServices,
    };
  }

  async updateServiceStatusForVendor(
    vendorId: number,
    dto: ToggleVendorServiceDto,
  ) {
    if (!dto) {
      throw new BadRequestException('service list is required');
    }
    console.log({ dto });
    const activeServiceIds = dto.activeServicesId ?? [];
    const inactiveServiceIds = dto.inActiveServicesId ?? [];

    if (activeServiceIds.length === 0 && inactiveServiceIds.length === 0) {
      throw new BadRequestException('At least one service must be provided');
    }

    // validation for both array
    const overlappingIds = activeServiceIds.filter((id) =>
      inactiveServiceIds.includes(id),
    );

    if (overlappingIds.length > 0) {
      throw new BadRequestException(
        'A service cannot be both active and inactive',
      );
    }
    try {
      await this.prisma.$transaction(async (tx) => {
        if (activeServiceIds.length > 0) {
          await tx.vendorService.updateMany({
            where: {
              vendorId,
              serviceId: {
                in: activeServiceIds,
              },
            },
            data: {
              isActive: true,
            },
          });
        }

        if (inactiveServiceIds.length > 0) {
          await tx.vendorService.updateMany({
            where: {
              vendorId,
              serviceId: {
                in: inactiveServiceIds,
              },
            },
            data: {
              isActive: false,
            },
          });
        }
      });

      return {
        message: 'Vendor service status updated successfully',
      };
    } catch {
      throw new InternalServerErrorException(
        'Failed to update vendor service status',
      );
    }
  }

  async uploadLogo(id: number, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Logo image is required');
    }

    const vendor = await this.prisma.vendor.findUnique({
      where: {
        userId: id,
      },
      select: {
        userId: true,
        logoPath: true,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // upload file
    const filePath = `vendors/${id}/logo-${Date.now()}`;

    const uploadedFile = await this.supabaseService.uploadFile(file, filePath);

    const publicUrl = this.supabaseService.getPublicUrl(uploadedFile.path);

    await this.prisma.vendor.update({
      where: {
        userId: id,
      },
      data: {
        logoUrl: publicUrl,
        logoPath: uploadedFile.path,
      },
    });

    // Delete previous logo after new logo is successfully saved
    if (vendor.logoPath) {
      await this.supabaseService.deleteFile(vendor.logoPath as string);
    }

    return {
      message: 'Vendor logo uploaded successfully',
      content: {
        logoUrl: publicUrl,
        logoPath: uploadedFile.path,
      },
    };
  }
}
