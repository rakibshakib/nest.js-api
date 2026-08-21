import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from 'src/auth/constant';
import { PrismaService } from 'src/prisma.service';
import { UserModule } from 'src/user/user.module';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({
  controllers: [VendorController],
  providers: [VendorService, PrismaService],
  imports: [
    UserModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: 2592000 }, // 1 day
    }),
  ],
})
export class VendorModule {}
