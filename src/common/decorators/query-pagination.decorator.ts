import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface Pagination {
  page: number;
  limit: number;
}

export const QueryPagination = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Pagination => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = ctx.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const query = request.query as Record<string, string>;
    const page = Math.max(1, parseInt(query?.page ?? '1', 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(query?.limit ?? '20', 10) || 20),
    );
    return { page, limit };
  },
);
