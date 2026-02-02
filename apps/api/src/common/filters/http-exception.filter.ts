import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawResponse = isHttpException ? exception.getResponse() : "Erro interno";
    const message = this.normalizeMessage(rawResponse);

    response.status(status).json({
      statusCode: status,
      path: request.url,
      message,
      details: rawResponse,
      timestamp: new Date().toISOString(),
    });
  }

  private normalizeMessage(response: unknown): string {
    if (typeof response === "string") {
      return response;
    }
    if (response && typeof response === "object") {
      const value = (response as { message?: unknown }).message;
      if (Array.isArray(value)) {
        return value.map((item) => String(item)).join(", ");
      }
      if (typeof value === "string") {
        return value;
      }
    }
    return "Erro interno";
  }
}
