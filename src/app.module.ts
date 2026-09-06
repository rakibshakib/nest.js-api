import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { SupabaseModule } from './common/supabase/supabase.module';
import { CustomerModule } from './customer/customer.module';
import { NoteModule } from './note/note.module';
import { ServicesModule } from './services/services.module';
import { UserModule } from './user/user.module';
import { VendorModule } from './vendor/vendor.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    UserModule,
    NoteModule,
    CategoryModule,
    VendorModule,
    ServicesModule,
    CustomerModule,
    SupabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [ConfigModule],
})
export class AppModule {}
