import { createParamDecorator, ExecutionContext } from '@nestjs/common';

const ALLOWED_FIELDS = new Set([
  'id',
  'email',
  'username',
  'displayName',
  'role',
  'plan',
  'emailVerified',
]);

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (data) {
      return ALLOWED_FIELDS.has(data) ? user?.[data] : undefined;
    }
    return user;
  },
);
