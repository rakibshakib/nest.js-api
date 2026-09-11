import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { handlePrismaError } from 'src/common/prisma/prisma-error.util';
import { SupabaseService } from 'src/common/supabase/supabase.service';
import { PrismaService } from 'src/prisma.service';
import { ServicesService } from 'src/services/services.service';
import { VendorService } from 'src/vendor/vendor.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  UpdateCategoryDto,
  UpdateCategoryStatusDto,
} from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
    private readonly servicesService: ServicesService,
    @Inject(forwardRef(() => VendorService))
    private readonly vendorService: VendorService,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    user: { sub: number; email: string },
    file?: Express.Multer.File,
  ) {
    try {
      let imageUrl: string | undefined;
      let imagePath: string | undefined;

      if (file) {
        const filePath = `categories/${Date.now()}-${file.originalname}`;
        const uploadedFile = await this.supabaseService.uploadFile(
          file,
          filePath,
        );
        imageUrl = this.supabaseService.getPublicUrl(uploadedFile.path);
        imagePath = uploadedFile.path;
      }

      const category = await this.prisma.category.create({
        data: {
          name: createCategoryDto.name,
          description: createCategoryDto.description,
          isActive: createCategoryDto.isActive ?? true,
          createdById: user.sub,
          imageUrl,
          imagePath,
        },
      });

      return {
        message: 'Category created successfully',
        content: category,
      };
    } catch (error: unknown) {
      handlePrismaError(error, {
        p2002: 'Category name already exists',
        default: 'Failed to create category',
      });
    }
  }

  async findAll(limit: number, page: number, all_services: boolean) {
    const skip = (page - 1) * limit;

    // transaction for 2 queries to ensure consistency
    const [categories, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip,
        include: {
          services: Boolean(all_services),
          _count: {
            select: {
              services: true,
              vendorCategories: true,
            },
          },
        },
      }),

      this.prisma.category.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: categories.map(({ _count, ...category }) => ({
        ...category,
        totalServices: _count.services,
        totalVendors: _count.vendorCategories,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findServicesByCategory(id: number, limit: number, page: number) {
    await this.ensureExists(id);
    return this.servicesService.findServicesByCategory(id, limit, page);
  }

  async findVendorsByCategory(id: number, limit: number, page: number) {
    await this.ensureExists(id);
    return this.vendorService.findVendorsByCategory(id, limit, page);
  }

  private async ensureExists(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }
  }

  async filterCategories(categoryIds: number[]) {
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
    return categories;
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: {
        id,
      },
      include: {
        services: true,
        _count: {
          select: {
            services: true,
            vendorCategories: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const { _count, ...rest } = category;

    return {
      ...rest,
      totalServices: _count.services,
      totalVendors: _count.vendorCategories,
    };
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
    file?: Express.Multer.File,
  ) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true, imagePath: true },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    try {
      let imageUrl: string | undefined;
      let imagePath: string | undefined;

      if (file) {
        const filePath = `categories/${id}-${Date.now()}-${file.originalname}`;
        const uploadedFile = await this.supabaseService.uploadFile(
          file,
          filePath,
        );
        imageUrl = this.supabaseService.getPublicUrl(uploadedFile.path);
        imagePath = uploadedFile.path;
      }

      const updatedCategory = await this.prisma.category.update({
        where: {
          id,
        },
        data: {
          ...updateCategoryDto,
          ...(file ? { imageUrl, imagePath } : {}),
        },
      });

      if (file && existing.imagePath) {
        await this.supabaseService.deleteFile(existing.imagePath as string);
      }

      return {
        message: 'Category updated successfully',
        content: updatedCategory,
      };
    } catch (error: unknown) {
      handlePrismaError(error, {
        p2025: 'Category not found',
        p2002: 'Category name already exists',
        default: 'Failed to update category',
      });
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
      handlePrismaError(error, {
        p2025: 'Category not found',
        default: 'Failed to update category status',
      });
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
      handlePrismaError(error, {
        p2025: 'Category not found',
        default: 'Failed to delete category',
      });
    }
  }
}
