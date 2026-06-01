import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateTransactionDto } from "../src/modules/transactions/dto/create-transaction.dto";
import { TransactionsQueryDto } from "../src/modules/transactions/dto/transactions-query.dto";
import { CreatePortfolioTransactionDto } from "../src/modules/portfolios/dto/create-portfolio-transaction.dto";

describe("financial DTO validation", () => {
  it("rejects negative transaction amounts", async () => {
    const dto = plainToInstance(CreateTransactionDto, {
      description: "Invalid expense",
      amount: -1,
      type: "expense",
      date: "2026-05-31",
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === "amount")).toBe(true);
  });

  it("rejects oversized transaction list limits", async () => {
    const dto = plainToInstance(TransactionsQueryDto, {
      limit: 5000,
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === "limit")).toBe(true);
  });

  it("rejects invalid portfolio decimal values", async () => {
    const dto = plainToInstance(CreatePortfolioTransactionDto, {
      assetId: "449a5c61-97d5-4a26-8bfa-352267cb17c0",
      type: "buy",
      quantity: "-1",
      unitPrice: "10",
      occurredAt: "2026-05-31",
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === "quantity")).toBe(true);
  });
});
