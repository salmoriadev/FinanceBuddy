import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthUser } from "../guards/jwt-auth.guard";

export const User = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthUser;
  },
);
