import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import {
  UpdateServiceDto,
  UpdateServiceStatusDto,
  UpdateServiceVariantDto,
} from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto, userId: number) {
    try {
      const { variations, ...serviceData } = createServiceDto;

      const service = await this.prisma.$transaction(async (tx) => {
        const newService = await tx.service.create({
          data: {
            ...serviceData,
            rating: 0,
            totalReviews: 0,
            isActive: true,
            createdById: userId,
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
    } catch {
      throw new InternalServerErrorException('Failed to create service');
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
        },
      }),

      this.prisma.service.count(),
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
        category: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return {
      message: 'Service found successfully',
      content: service,
    };
  }

  async update(id: number, updateServiceDto: UpdateServiceDto) {
    try {
      const { variations, ...serviceData } = updateServiceDto;

      const service = await this.prisma.$transaction(async (tx) => {
        await tx.service.update({
          where: {
            id,
          },
          data: {
            ...serviceData,
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
      return {
        message: 'Service updated successfully',
        content: service,
      };
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Service not found');
      }

      throw new InternalServerErrorException('Failed to update service');
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
        message: 'Category deleted successfully',
      };
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Category not found');
      }

      throw new InternalServerErrorException('Failed to delete category');
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
        message: 'Category status updated successfully',
        content: updated,
      };
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Category not found');
      }

      throw new InternalServerErrorException(
        'Failed to update category status',
      );
    }
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
