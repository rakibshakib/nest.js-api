import { Prisma } from 'generated/prisma/client';

export type CustomerWithUser = Prisma.CustomerGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        email: true;
        phone: true;
      };
    };
  };
}>;
