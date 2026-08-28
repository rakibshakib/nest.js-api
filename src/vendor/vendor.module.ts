import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from 'src/auth/constant';
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
    CategoryModule,
    SupabaseModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: 2592000 }, // 1 day
    }),
  ],
})
export class VendorModule {}
