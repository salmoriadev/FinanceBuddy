import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import compression from "compression";
import { json, urlencoded } from "express";
import { AppModule } from "./app.module";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    cors: false,
  });
  const configService = app.get(ConfigService);

  const corsOrigin = configService.get<string>("CORS_ORIGIN");
  const trustProxyValue = configService.get<string>("TRUST_PROXY");
  const isProd = configService.get<string>("NODE_ENV") === "production";
  const adapter = app.getHttpAdapter();
  const instance = adapter?.getInstance?.();
  const shouldTrustProxy =
    trustProxyValue === "1" || trustProxyValue?.toLowerCase() === "true";
  if (instance?.set && shouldTrustProxy) {
    instance.set("trust proxy", 1);
  }
  app.enableCors({
    origin:
      corsOrigin && corsOrigin.length > 0
        ? corsOrigin.split(",").map((v) => v.trim()).filter(Boolean)
        : isProd
          ? false
          : true,
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-CSRF-Token",
    ],
  });

  app.use(helmet());
  const bodyLimit = configService.get<string>("REQUEST_BODY_LIMIT") || "100kb";
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: true, limit: bodyLimit, parameterLimit: 100 }));
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
  app.useGlobalInterceptors(new LoggingInterceptor());

  const enableSwagger =
    !isProd && configService.get<string>("ENABLE_SWAGGER") !== "false";
  if (enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("FinanceBuddy API")
      .setDescription("Personal finance management API")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("docs", app, document);
  }

  const port = configService.get<number>("PORT") ?? 4000;
  await app.listen(port);
}

bootstrap();
