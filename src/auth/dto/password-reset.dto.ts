import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  otp: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  newPassword: string;

  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}
