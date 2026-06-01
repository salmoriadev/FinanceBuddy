import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./database/prisma.module";
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 100,
      },
    ]),
    PrismaModule,
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
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
