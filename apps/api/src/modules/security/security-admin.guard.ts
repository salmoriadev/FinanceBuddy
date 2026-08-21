import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class SecurityAdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const userId = String(request.user?.id ?? "").trim().toLowerCase();
    const allowedUserIds = this.getAllowedUserIds();

    if (!UUID_PATTERN.test(userId) || !allowedUserIds.has(userId)) {
      throw new ForbiddenException("Security admin access required");
    }

    return true;
  }

  private getAllowedUserIds() {
    const raw =
      this.configService.get<string>("SECURITY_ADMIN_USER_IDS") || "";
    return new Set(
      raw
        .split(",")
        .map((userId) => userId.trim().toLowerCase())
        .filter((userId) => UUID_PATTERN.test(userId)),
    );
  }
}
