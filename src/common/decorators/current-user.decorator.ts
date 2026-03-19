import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// This decorator extracts the user attached by JwtStrategy.validate()
// Usage: @CurrentUser() user: User  — in any controller method
// Instead of: @Req() req: Request  then  req.user  every time
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
