import { ConflictException, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async register(request: RegisterDto) {
    const { email, password, name } = request;

    const existingUser = await this.userService.getUserByEmail(email);

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const newUser = await this.userService.createUser(email, password, name);

    return {
      message: 'User registered successfully',
      userId: newUser.id,
    };
  }
}
