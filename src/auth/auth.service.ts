import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}
  register(request: RegisterDto) {
    console.log('Register request:', request);

    const existingUser = this.userService.getUserByEmail(request.email);
    console.log('Existing user:', existingUser);

    if (existingUser) {
      throw new Error('Email already exists');
    }
    return {
      message: 'User registered successfully',
    };
  }
}
