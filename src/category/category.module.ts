import { Module } from '@nestjs/common';
import { SupabaseModule } from 'src/common/supabase/supabase.module';
import { PrismaService } from 'src/prisma.service';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService, PrismaService],
  imports: [SupabaseModule],
  exports: [CategoryService],
})
export class CategoryModule {}
