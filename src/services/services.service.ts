import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { handlePrismaError } from 'src/common/prisma/prisma-error.util';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import { PrismaService } from 'src/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import {
  UpdateServiceDto,
  UpdateServiceStatusDto,
  UpdateServiceVariantDto,
} from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async create(
    createServiceDto: CreateServiceDto,
    userId: number,
    file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Service image is required');
    }

    try {
      const { variations, ...serviceData } = createServiceDto;

      const filePath = `services/${Date.now()}-${file.originalname}`;
      const uploadedFile = await this.supabaseService.uploadFile(
        file,
        filePath,
      );
      const imageUrl = this.supabaseService.getPublicUrl(uploadedFile.path);

      const service = await this.prisma.$transaction(async (tx) => {
        const newService = await tx.service.create({
          data: {
            ...serviceData,
            rating: 0,
            totalReviews: 0,
            isActive: true,
            createdById: userId,
            imageUrl,
            imagePath: uploadedFile.path,
          },
        });

        if (variations?.length) {
          await tx.serviceVariation.createMany({
            data: variations.map((variation) => ({
              ...variation,
              serviceId: newService.id,
            })),
          });
        }

        return tx.service.findUnique({
          where: {
            id: newService.id,
          },
          include: {
            variations: true,
          },
        });
      });
      return {
        message: 'Service created successfully',
        content: service,
      };
    } catch (error: unknown) {
      handlePrismaError(error, {
        default: 'Failed to create service',
      });
    }
  }

  async findAll(limit: number, page: number) {
    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          variations: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          vendorServices: {
            where: {
              isActive: true,
            },
            select: {
              vendor: {
                select: {
                  userId: true,
                  businessName: true,
                  logoUrl: true,
                  rating: true,
                },
              },
            },
          },
        },
      }),

      this.prisma.service.count(),
    ]);

    return {
      data: services.map((service) => this.attachServiceVendors(service)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const service = await this.prisma.service.findUnique({
      where: {
        id,
      },
      omit: {
        createdById: true,
      },
      include: {
        variations: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        vendorServices: {
          where: {
            isActive: true,
          },
          select: {
            vendor: {
              select: {
                userId: true,
                businessName: true,
                logoUrl: true,
                rating: true,
              },
            },
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return {
      message: 'Service found successfully',
      content: this.attachServiceVendors(service),
    };
  }

  private attachServiceVendors<
    T extends {
      vendorServices: { vendor: object }[];
    },
  >(service: T) {
    const { vendorServices, ...rest } = service;

    return {
      ...rest,
      vendors: vendorServices.map((vs) => vs.vendor),
    };
  }

  async update(
    id: number,
    updateServiceDto: UpdateServiceDto,
    file?: Express.Multer.File,
  ) {
    const existing = await this.prisma.service.findUnique({
      where: { id },
      select: { id: true, imagePath: true },
    });

    if (!existing) {
      throw new NotFoundException('Service not found');
    }

    try {
      const { variations, ...serviceData } = updateServiceDto;

      let imageUrl: string | undefined;
      let imagePath: string | undefined;

      if (file) {
        const filePath = `services/${id}-${Date.now()}-${file.originalname}`;
        const uploadedFile = await this.supabaseService.uploadFile(
          file,
          filePath,
        );
        imageUrl = this.supabaseService.getPublicUrl(uploadedFile.path);
        imagePath = uploadedFile.path;
      }

      const service = await this.prisma.$transaction(async (tx) => {
        await tx.service.update({
          where: {
            id,
          },
          data: {
            ...serviceData,
            ...(file ? { imageUrl, imagePath } : {}),
          },
        });

        if (variations && variations?.length) {
          const existingVariant = variations.filter(
            (variation): variation is UpdateServiceVariantDto =>
              variation.id !== undefined,
          );

          const newVariants = variations.filter(
            (variation) => variation.id === undefined,
          );

          // Delete removed variations
          const existingVariantIds = existingVariant
            .map((variation) => variation.id)
            .filter((id): id is number => id !== undefined);

          await tx.serviceVariation.deleteMany({
            where: {
              serviceId: id,
              NOT: {
                id: {
                  in: existingVariantIds,
                },
              },
            },
          });

          // Create new variations
          if (newVariants && newVariants.length) {
            await tx.serviceVariation.createMany({
              data: newVariants.map((variation) => ({
                name: variation.name,
                price: variation.price,
                serviceId: id,
              })),
            });
          }

          // update many
          for (const variation of existingVariant) {
            await tx.serviceVariation.update({
              where: {
                id: variation.id,
              },
              data: {
                name: variation.name,
                price: variation.price,
              },
            });
          }
        }

        return tx.service.findUnique({
          where: {
            id: id,
          },
          include: {
            variations: true,
          },
        });
      });

      if (file && existing.imagePath) {
        await this.supabaseService.deleteFile(existing.imagePath);
      }

      return {
        message: 'Service updated successfully',
        content: service,
      };
    } catch (error: unknown) {
      handlePrismaError(error, {
        p2025: 'Service not found',
        default: 'Failed to update service',
      });
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.service.delete({
        where: {
          id,
        },
      });

      return {
        message: 'Service deleted successfully',
      };
    } catch (error: unknown) {
      handlePrismaError(error, {
        p2025: 'Service not found',
        default: 'Failed to delete service',
      });
    }
  }

  async updateStatus(id: number, statusDto: UpdateServiceStatusDto) {
    try {
      const updated = await this.prisma.service.update({
        where: {
          id,
        },
        data: {
          isActive: statusDto.isActive,
        },
      });

      return {
        message: 'Service status updated successfully',
        content: updated,
      };
    } catch (error: unknown) {
      handlePrismaError(error, {
        p2025: 'Service not found',
        default: 'Failed to update service status',
      });
    }
  }

  async findForCustomer(
    filters: {
      mostRated?: boolean;
      mostOrdered?: boolean;
      hasDiscount?: boolean;
    },
    limit: number,
    page: number,
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.ServiceWhereInput = { isActive: true };
    const orderBy: Prisma.ServiceOrderByWithRelationInput[] = [];

    if (filters.hasDiscount) {
      orderBy.push({ discountAmount: 'desc' });
    }

    if (filters.mostRated) {
      orderBy.push({ totalReviews: 'desc' }, { rating: 'desc' });
    }

    // mostOrdered ignored: no order module yet, same result either way
    void filters.mostOrdered;

    orderBy.push({ createdAt: 'desc' });

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          variations: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          vendorServices: {
            where: {
              isActive: true,
            },
            select: {
              vendor: {
                select: {
                  userId: true,
                  businessName: true,
                  logoUrl: true,
                  rating: true,
                },
              },
            },
          },
        },
      }),

      this.prisma.service.count({ where }),
    ]);

    return {
      data: services.map((service) => this.attachServiceVendors(service)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findServicesByCategory(
    categoryId: number,
    limit: number,
    page: number,
  ) {
    const skip = (page - 1) * limit;
    const where = { categoryId };

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          variations: true,
        },
      }),

      this.prisma.service.count({ where }),
    ]);

    return {
      data: services,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findServiceIdsByCategoryIds(
    categoryIds: number[],
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx ?? this.prisma;

    return prisma.service.findMany({
      where: {
        categoryId: {
          in: categoryIds,
        },
        isActive: true,
      },
      select: {
        id: true,
        categoryId: true,
      },
    });
  }
}
