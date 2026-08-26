import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import bcrypt from 'bcrypt';
import { UserType } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const existingUser = await this.userService.getUserByEmail(
      createCustomerDto.email,
    );

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createCustomerDto.password, 10);

    try {
      const newCustomer = await this.prisma.$transaction(
        async (transaction) => {
          const user = await this.userService.createUser(
            {
              name: createCustomerDto.name,
              email: createCustomerDto.email,
              password: hashedPassword,
              phone: createCustomerDto.phone,
            },
            UserType.CUSTOMER,
            transaction,
          );

          const customer = await transaction.customer.create({
            data: {
              userId: user.id,
              address: createCustomerDto.address,
            },
          });

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            userType: user.userType,
            address: customer.address,
            createdAt: customer.createdAt,
          };
        },
      );

      const payload = {
        sub: newCustomer.id,
        username: newCustomer.name,
        email: newCustomer.email,
        userType: newCustomer.userType,
      };

      const access_token = await this.jwtService.signAsync(payload);

      this.logger.log('New customer registered successfully', {
        userId: newCustomer.id,
        email: newCustomer.email,
      });

      return {
        customer: newCustomer,
        access_token,
      };
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already exists');
      }

      throw new InternalServerErrorException('Failed to register customer');
    }
  }

  findAll() {
    return `This action returns all customer`;
  }

  findOne(id: number) {
    return `This action returns a #${id} customer`;
  }

  update(id: number, updateCustomerDto: UpdateCustomerDto) {
    return `This action updates a #${id} customer`;
  }

  remove(id: number) {
    return `This action removes a #${id} customer`;
  }
}
