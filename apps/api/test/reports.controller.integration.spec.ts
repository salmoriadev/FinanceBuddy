/**
 * Validates reports controller integration behavior for authenticated requests
 * and query DTO validation on report year filtering.
 */
import { CanActivate, ExecutionContext, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { ReportsController } from "../src/modules/reports/reports.controller";
import { ReportsService } from "../src/modules/reports/reports.service";
import { JwtAuthGuard } from "../src/common/guards/jwt-auth.guard";

class AuthenticatedGuardMock implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.user = { id: "user-1" };
    return true;
  }
}

describe("ReportsController (integration)", () => {
  let app: INestApplication;

  const reportsServiceMock = {
    getAnalytics: jest.fn(),
    getSummary: jest.fn(),
  };

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        { provide: ReportsService, useValue: reportsServiceMock },
      ],
    });
    const moduleRef = await moduleBuilder
      .overrideGuard(JwtAuthGuard)
      .useClass(AuthenticatedGuardMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    reportsServiceMock.getAnalytics.mockResolvedValue({
      year: 2026,
      summary: {
        year: 2026,
        income: 1000,
        expense: 200,
        balance: 800,
        savingsRate: 80,
      },
      monthly: [],
      categories: [],
      currentMonthComparison: {
        currentExpense: 0,
        lastExpense: 0,
        variation: null,
        hasVariationBaseline: false,
      },
      availableYears: [2026],
    });
    reportsServiceMock.getSummary.mockResolvedValue({
      year: 2026,
      income: 1000,
      expense: 200,
      balance: 800,
      savingsRate: 80,
    });
  });

  it("GET /reports/summary rejects invalid year format", async () => {
    const response = await request(app.getHttpServer()).get(
      "/api/v1/reports/summary?year=invalid",
    );

    expect(response.status).toBe(400);
    expect(reportsServiceMock.getSummary).not.toHaveBeenCalled();
  });

  it("GET /reports/analytics rejects invalid year format", async () => {
    const response = await request(app.getHttpServer()).get(
      "/api/v1/reports/analytics?year=invalid",
    );

    expect(response.status).toBe(400);
    expect(reportsServiceMock.getAnalytics).not.toHaveBeenCalled();
  });

  it("GET /reports/summary rejects out-of-range year", async () => {
    const response = await request(app.getHttpServer()).get(
      "/api/v1/reports/summary?year=9999",
    );

    expect(response.status).toBe(400);
    expect(reportsServiceMock.getSummary).not.toHaveBeenCalled();
  });

  it("GET /reports/summary accepts valid year and forwards parsed number", async () => {
    const response = await request(app.getHttpServer()).get(
      "/api/v1/reports/summary?year=2026",
    );

    expect(response.status).toBe(200);
    expect(reportsServiceMock.getSummary).toHaveBeenCalledWith("user-1", 2026);
    expect(response.body).toMatchObject({
      year: 2026,
      income: 1000,
      expense: 200,
      balance: 800,
      savingsRate: 80,
    });
  });

  it("GET /reports/analytics accepts valid year and forwards parsed number", async () => {
    const response = await request(app.getHttpServer()).get(
      "/api/v1/reports/analytics?year=2026",
    );

    expect(response.status).toBe(200);
    expect(reportsServiceMock.getAnalytics).toHaveBeenCalledWith("user-1", 2026);
    expect(response.body).toMatchObject({
      year: 2026,
      summary: {
        year: 2026,
        income: 1000,
        expense: 200,
      },
      availableYears: [2026],
    });
  });
});
