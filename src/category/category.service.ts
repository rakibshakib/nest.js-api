import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PrismaService } from 'src/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  UpdateCategoryDto,
  UpdateCategoryStatusDto,
} from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    user: { sub: number; email: string },
  ) {
    try {
      const category = await this.prisma.category.create({
        data: {
          name: createCategoryDto.name,
          description: createCategoryDto.description,
          isActive: createCategoryDto.isActive ?? true,
          createdById: user.sub,
        },
      });

      return {
        message: 'Category created successfully',
        content: category,
      };
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Category name already exists');
      }

      throw new InternalServerErrorException('Failed to create category');
    }
  }

  async findAll(limit: number, page: number) {
    const skip = (page - 1) * limit;

    // transaction for 2 queries to ensure consistency
    const [categories, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip,
      }),

      this.prisma.category.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: categories,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: {
        id,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    try {
      const updatedCategory = await this.prisma.category.update({
        where: {
          id,
        },
        data: updateCategoryDto,
      });

      return {
        message: 'Category updated successfully',
        content: updatedCategory,
      };
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Category not found');
      }

      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Category name already exists');
      }

      throw new InternalServerErrorException('Failed to update category');
    }
  }

  async updateStatus(
    id: number,
    updateCategoryStatusDto: UpdateCategoryStatusDto,
  ) {
    try {
      const updatedCategory = await this.prisma.category.update({
        where: {
          id,
        },
        data: {
          isActive: updateCategoryStatusDto.isActive,
        },
      });

      return {
        message: 'Category status updated successfully',
        content: updatedCategory,
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

  async remove(id: number) {
    try {
      const deletedCategory = await this.prisma.category.delete({
        where: {
          id,
        },
      });

      return {
        message: 'Category deleted successfully',
        content: deletedCategory,
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
}
