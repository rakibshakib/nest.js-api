import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(request: RegisterDto) {
    const { email, password } = request;

    const existingUser = await this.userService.getUserByEmail(email);

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // hashing password

    const saltRounds = 10;

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await this.userService.createUser({
      ...request,
      password: hashedPassword,
    });

    // creating jwt token
    const payload = {
      sub: newUser.id,
      username: newUser.name,
      email: newUser.email,
    };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      access_token,
    };
  }

  // login user
  async login(email: string, password: string) {
    const user = await this.userService.getUserByEmail(email);

    if (!user) {
      throw new ConflictException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new ConflictException('Invalid password');
    }

    const payload = {
      sub: user.id,
      username: user.name,
      email: user.email,
    };
    const access_token = await this.jwtService.signAsync(payload);

    return {
      message: 'User logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      access_token,
    };
  }
}
