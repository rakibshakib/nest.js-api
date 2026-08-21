import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { NoteModule } from './note/note.module';
import { UserModule } from './user/user.module';
import { VendorModule } from './vendor/vendor.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    ConfigModule.forRoot(),
    NoteModule,
    CategoryModule,
    VendorModule,
    ServicesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
