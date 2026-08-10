import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}
  async register(request: RegisterDto) {
    console.log('Register request:', request);

    const existingUser = await this.userService.getUserByEmail(request.email);
    console.log('Existing user:', existingUser);

    if (existingUser?.email) {
      return {
        message: 'User already exists',
        status: 403, // forbidden
      };
    }

    const newUser = await this.userService.createUser(
      request.email,
      request.password,
      request.name,
    );

    if (newUser?.id) {
      console.log('New user created:', newUser);
    }

    return {
      message: 'User registered successfully',
    };
  }
}
