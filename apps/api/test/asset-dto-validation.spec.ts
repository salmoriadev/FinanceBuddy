import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateAssetDto } from "../src/modules/assets/dto/create-asset.dto";
import { SearchAssetsQueryDto } from "../src/modules/assets/dto/search-assets-query.dto";

describe("asset class DTO validation", () => {
  it.each([
    "etf",
    "crypto",
    "fixed_income",
  ])("accepts %s during asset creation and search", async (assetClass) => {
    const createDto = plainToInstance(CreateAssetDto, {
      ticker: "ASSET",
      name: "Portfolio asset",
      class: assetClass,
    });
    const searchDto = plainToInstance(SearchAssetsQueryDto, {
      q: "asset",
      class: assetClass,
    });

    await expect(validate(createDto)).resolves.toHaveLength(0);
    await expect(validate(searchDto)).resolves.toHaveLength(0);
  });
});
