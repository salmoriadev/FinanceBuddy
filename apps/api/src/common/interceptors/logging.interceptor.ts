import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const method = req.method as string;
    const path = (req.route?.path as string | undefined) || (req.path as string) || "/";
    const start = Date.now();
    const res = context.switchToHttp().getResponse();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const statusCode = res?.statusCode ?? 0;
        // eslint-disable-next-line no-console
        console.log(`${method} ${path} ${statusCode} ${duration}ms`);
      }),
    );
  }
}
