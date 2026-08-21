import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class SecurityAdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const email = request.user?.email;
    const allowedEmails = this.getAllowedEmails();

    if (!email || !allowedEmails.has(String(email).toLowerCase())) {
      throw new ForbiddenException("Security admin access required");
    }

    return true;
  }

  private getAllowedEmails() {
    const raw = this.configService.get<string>("SECURITY_ADMIN_EMAILS") || "";
    return new Set(
      raw
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    );
  }
}
