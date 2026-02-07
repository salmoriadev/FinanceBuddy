/**
 * This file implements Jwt Auth.Guard behavior for the backend shared infrastructure layer.
 * Its role is to keep this responsibility isolated and maintainable within FinanceBuddy.
 */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
}

interface AppJwtPayload extends JwtPayload {
  sub?: string;
  email?: string;
  aud?: string | string[];
  iss?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization as string | undefined;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing access token");
    }

    const token = authHeader.replace("Bearer ", "");
    const jwtSecret = this.configService.get<string>("AUTH_JWT_SECRET");
    if (!jwtSecret) {
      throw new UnauthorizedException("JWT secret is not configured");
    }

    try {
      const payload = jwt.verify(token, jwtSecret, {
        algorithms: ["HS256"],
      }) as AppJwtPayload;

      const expectedAud = this.configService.get<string>("AUTH_JWT_AUD");
      if (expectedAud) {
        const aud = payload.aud;
        const audList = Array.isArray(aud) ? aud : aud ? [aud] : [];
        if (!audList.includes(expectedAud)) {
          throw new UnauthorizedException("Token audience is invalid");
        }
      }

      const expectedIss = this.configService.get<string>("AUTH_JWT_ISSUER");
      if (expectedIss && payload.iss !== expectedIss) {
        throw new UnauthorizedException("Token issuer is invalid");
      }

      if (!payload.sub) {
        throw new UnauthorizedException("Invalid token");
      }

      const user: AuthUser = {
        id: payload.sub,
        email: payload.email,
      };
      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
