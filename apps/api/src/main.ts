import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const configService = app.get(ConfigService);

  const corsOrigin = configService.get<string>("CORS_ORIGIN");
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(",").map((v) => v.trim()) : true,
    credentials: true,
  });

  app.use(helmet());
  app.use(cookieParser());
  app.use(compression());
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("FinanceBuddy API")
    .setDescription("API de gestão financeira pessoal")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  const port = configService.get<number>("PORT") ?? 4000;
  await app.listen(port);
}

bootstrap();
