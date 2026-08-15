import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    user: { sub: number; email: string },
  ) {
    try {
      const category = await this.prisma.category.create({
        data: {
          name: createCategoryDto.name,
          description: createCategoryDto.description,
          status: createCategoryDto.status,
          createdById: user.sub,
        },
      });

      return {
        message: 'Category created successfully',
        content: category,
      };
    } catch (e) {
      throw new InternalServerErrorException('Failed to create category');
    }
  }

  async findAll(limit: number, page: number) {
    return `This action returns all category`;
  }

  findOne(id: number) {
    return `This action returns a #${id} category`;
  }

  update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return `This action updates a #${id} category`;
  }

  remove(id: number) {
    return `This action removes a #${id} category`;
  }
}
