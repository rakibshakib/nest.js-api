import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(request: RegisterDto) {
    const { email, password } = request;

    const existingUser = await this.userService.getUserByEmail(email);

    if (existingUser) {
      this.logger.error('User registration failed: User already exists', {
        email,
      });
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
      userType: newUser.userType,
    };
    const access_token = await this.jwtService.signAsync(payload);

    this.logger.log('New user registered successfully', {
      userId: newUser.id,
      email: newUser.email,
    });

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
      throw new UnauthorizedException('Email or Password did not matched');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new ConflictException('Invalid password');
    }

    const payload = {
      sub: user.id,
      username: user.name,
      email: user.email,
      userType: user.userType,
    };
    const access_token = await this.jwtService.signAsync(payload);

    this.logger.log('User logged in successfully', {
      userId: user.id,
      email: user.email,
    });

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
