import { forwardRef, Module } from '@nestjs/common';
import { SupabaseModule } from 'src/common/supabase/supabase.module';
import { PrismaService } from 'src/prisma.service';
import { ServicesModule } from 'src/services/services.module';
import { VendorModule } from 'src/vendor/vendor.module';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService, PrismaService],
  imports: [SupabaseModule, ServicesModule, forwardRef(() => VendorModule)],
  exports: [CategoryService],
})
export class CategoryModule {}
