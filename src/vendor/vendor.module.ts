import { forwardRef, Module } from '@nestjs/common';
import { CategoryModule } from 'src/category/category.module';
import { SupabaseModule } from 'src/common/supabase/supabase.module';
import { PrismaService } from 'src/prisma.service';
import { ServicesModule } from 'src/services/services.module';
import { UserModule } from 'src/user/user.module';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({
  controllers: [VendorController],
  providers: [VendorService, PrismaService],
  imports: [
    UserModule,
    ServicesModule,
    forwardRef(() => CategoryModule),
    SupabaseModule,
  ],
  exports: [VendorService],
})
export class VendorModule {}
