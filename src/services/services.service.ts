import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

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

  findAll() {
    return `This action returns all services`;
  }

  findOne(id: number) {
    return `This action returns a #${id} service`;
  }

  update(id: number, updateServiceDto: UpdateServiceDto) {
    return `This action updates a #${id} service`;
  }

  remove(id: number) {
    return `This action removes a #${id} service`;
  }
}
