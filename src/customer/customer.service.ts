import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import bcrypt from 'bcrypt';
import { UserType } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerWithUser } from './types/customer.types';

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
              isActive: true,
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

  async findAll(limit: number, page: number) {
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      }),

      this.prisma.customer.count(),
    ]);

    const formattedCustomer = customers?.map((cs) => this.formatCustomer(cs));

    return {
      data: formattedCustomer || [],
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, user: { sub: number; userType: UserType }) {
    const isAdmin = user.userType === UserType.ADMIN;
    const isOwner = user.sub === id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You are not allowed to view this customer');
    }
    const customer = await this.prisma.customer.findUnique({
      where: { userId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return {
      message: 'Customer found successfully',
      content: this.formatCustomer(customer),
    };
  }

  update(id: number, updateCustomerDto: UpdateCustomerDto) {
    return `This action updates a #${id} customer`;
  }

  remove(id: number) {
    return `This action removes a #${id} customer`;
  }

  private formatCustomer(customer: CustomerWithUser) {
    const { user, ...customerData } = customer;

    return {
      ...customerData,
      name: user.name,
      email: user.email,
      phone: user.phone,
    };
  }
}
