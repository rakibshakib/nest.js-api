import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { UserType } from 'generated/prisma/enums';
import { handlePrismaError } from 'src/common/prisma/prisma-error.util';
import { PrismaService } from 'src/prisma.service';
import { UserService } from 'src/user/user.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import {
  UpdateCustomerDto,
  updateCustomerStatusDto,
} from './dto/update-customer.dto';
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
      handlePrismaError(error, {
        p2002: 'Email already exists',
        default: 'Failed to register customer',
      });
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

  async update(
    id: number,
    dto: UpdateCustomerDto,
    user: { sub: number; userType: UserType },
  ) {
    if (!dto || Object.keys(dto).length === 0) {
      throw new BadRequestException('At least one field is required to update');
    }

    const isOwner = user.sub === id;

    if (!isOwner) {
      throw new ForbiddenException(
        'You are not allowed to update this profile',
      );
    }

    const { name, address, phone, password, confirmPassword } = dto || {};

    // Password validation
    if ((password && !confirmPassword) || (!password && confirmPassword)) {
      throw new BadRequestException(
        'Password and confirm password are both required',
      );
    }

    if (password && password !== confirmPassword) {
      throw new BadRequestException(
        'Password and confirm password do not match',
      );
    }

    const userData: {
      name?: string;
      phone?: string;
      password?: string;
    } = {};

    const customerData: {
      address?: string;
    } = {};

    if (name) userData.name = name;
    if (phone) userData.phone = phone;

    if (address) customerData.address = address;

    if (password) {
      userData.password = await bcrypt.hash(password, 10);
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        if (Object.keys(userData).length) {
          await this.userService.updateUser(id, userData, tx);
        }

        if (Object.keys(customerData).length) {
          await tx.customer.update({
            where: { userId: id },
            data: customerData,
          });
        }
      });

      return {
        message: 'Customer updated successfully',
      };
    } catch (error: unknown) {
      handlePrismaError(error, {
        p2025: 'Customer not found',
        default: 'Failed to update customer',
      });
    }
  }

  async updateStatus(id: number, dto: updateCustomerStatusDto) {
    try {
      const customer = await this.prisma.customer.update({
        where: {
          userId: id,
        },
        data: {
          isActive: dto.isActive,
        },
      });

      return {
        message: 'Customer status updated successfully',
        content: customer,
      };
    } catch (error: unknown) {
      handlePrismaError(error, {
        p2025: 'Customer not found',
        default: 'Failed to update customer',
      });
    }
  }

  async remove(id: number, user: { sub: number; userType: UserType }) {
    console.log('deleted', id);
    const isAdmin = user.userType === UserType.ADMIN;
    const isOwner = user.sub === id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('You are not allowed to view this customer');
    }
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const customer = await tx.customer.delete({
          where: { userId: id },
        });

        await tx.user.delete({
          where: { id },
        });

        return customer;
      });

      return {
        message: 'Customer deleted successfully',
        content: result,
      };
    } catch (error: unknown) {
      handlePrismaError(error, {
        p2025: 'Customer not found',
        default: 'Failed to delete customer',
      });
    }
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
