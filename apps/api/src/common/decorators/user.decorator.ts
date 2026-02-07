/**
 * This file implements User.Decorator behavior for the backend shared infrastructure layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthUser } from "../guards/jwt-auth.guard";

export const User = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthUser;
  },
);
