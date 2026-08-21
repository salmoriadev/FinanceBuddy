import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import {
  CreateInvestmentDto,
  MAX_LEGACY_INVESTMENT_MONEY_VALUE,
} from "../src/modules/investments/dto/create-investment.dto";
import { UpdateInvestmentDto } from "../src/modules/investments/dto/update-investment.dto";
import { MAX_QUANTITY_VALUE } from "../src/common/validators/financial-values";

const errorProperties = async (dto: object) =>
  new Set((await validate(dto)).map((error) => error.property));

describe("legacy investment DTO bounds", () => {
  it("accepts values at the storage boundaries", async () => {
    const dto = plainToInstance(CreateInvestmentDto, {
      name: "N".repeat(160),
      category: "C".repeat(80),
      assetSymbol: "a".repeat(24),
      quantity: MAX_QUANTITY_VALUE,
      averagePrice: MAX_LEGACY_INVESTMENT_MONEY_VALUE,
      investedAmount: 0,
      currentValue: MAX_LEGACY_INVESTMENT_MONEY_VALUE,
      notes: "N".repeat(1000),
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.assetSymbol).toBe("A".repeat(24));
  });

  it("rejects negative and out-of-range financial values", async () => {
    const dto = plainToInstance(CreateInvestmentDto, {
      name: "Invalid position",
      quantity: MAX_QUANTITY_VALUE + 1,
      averagePrice: MAX_LEGACY_INVESTMENT_MONEY_VALUE + 1,
      investedAmount: -0.01,
      currentValue: MAX_LEGACY_INVESTMENT_MONEY_VALUE + 1,
    });

    const properties = await errorProperties(dto);

    expect(properties.has("quantity")).toBe(true);
    expect(properties.has("averagePrice")).toBe(true);
    expect(properties.has("investedAmount")).toBe(true);
    expect(properties.has("currentValue")).toBe(true);
  });

  it("rejects text that exceeds the public DTO contract", async () => {
    const dto = plainToInstance(CreateInvestmentDto, {
      name: "N".repeat(161),
      category: "C".repeat(81),
      assetSymbol: "S".repeat(25),
      investedAmount: 100,
      currentValue: 100,
      notes: "N".repeat(1001),
    });

    const properties = await errorProperties(dto);

    expect(properties.has("name")).toBe(true);
    expect(properties.has("category")).toBe(true);
    expect(properties.has("assetSymbol")).toBe(true);
    expect(properties.has("notes")).toBe(true);
  });

  it("applies the same bounds to partial updates", async () => {
    const dto = plainToInstance(UpdateInvestmentDto, {
      currentValue: MAX_LEGACY_INVESTMENT_MONEY_VALUE + 1,
      notes: "N".repeat(1001),
    });

    const properties = await errorProperties(dto);

    expect(properties.has("currentValue")).toBe(true);
    expect(properties.has("notes")).toBe(true);
  });
});
