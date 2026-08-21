import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./database/prisma.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { TransactionsModule } from "./modules/transactions/transactions.module";
import { BudgetsModule } from "./modules/budgets/budgets.module";
import { GoalsModule } from "./modules/goals/goals.module";
import { InvestmentsModule } from "./modules/investments/investments.module";
import { AssetsModule } from "./modules/assets/assets.module";
import { PortfoliosModule } from "./modules/portfolios/portfolios.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { SecurityModule } from "./modules/security/security.module";
import { AuditedThrottlerGuard } from "./modules/security/audited-throttler.guard";
import { validateEnvironment } from "./config/environment.validation";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    PrismaModule,
    SecurityModule,
    AuthModule,
    HealthModule,
    TransactionsModule,
    BudgetsModule,
    GoalsModule,
    InvestmentsModule,
    AssetsModule,
    PortfoliosModule,
    CategoriesModule,
    ReportsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuditedThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
