import { Module } from '@nestjs/common';
import { SupabaseModule } from 'src/common/supabase/supabase.module';
import { PrismaService } from 'src/prisma.service';
import { UserModule } from 'src/user/user.module';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';

@Module({
  controllers: [CustomerController],
  providers: [CustomerService, PrismaService],
  imports: [UserModule, SupabaseModule],
})
export class CustomerModule {}
