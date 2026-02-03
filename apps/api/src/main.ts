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
  const isProd = configService.get<string>("NODE_ENV") === "production";
  app.set("trust proxy", 1);
  app.enableCors({
    origin:
      corsOrigin && corsOrigin.length > 0
        ? corsOrigin.split(",").map((v) => v.trim()).filter(Boolean)
        : isProd
          ? false
          : true,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
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
    .setDescription("Personal finance management API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  const port = configService.get<number>("PORT") ?? 4000;
  await app.listen(port);
}

bootstrap();
