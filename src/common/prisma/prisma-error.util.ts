import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from 'generated/prisma/internal/prismaNamespace';

export function handlePrismaError(
  error: unknown,
  messages?: {
    p2002?: string;
    p2025?: string;
    default?: string;
  },
): never {
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        throw new ConflictException(
          messages?.p2002 ?? 'Resource already exists',
        );

      case 'P2025':
        throw new NotFoundException(messages?.p2025 ?? 'Resource not found');
    }
  }

  throw new InternalServerErrorException(
    messages?.default ?? 'Something went wrong',
  );
}
