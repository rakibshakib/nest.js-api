import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class CreateVendorDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  businessName: string;

  @IsString()
  address: string;

  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;
}
