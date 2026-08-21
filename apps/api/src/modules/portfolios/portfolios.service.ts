import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { assertResourceFound } from "../../common/services/resource-assertions";
import { buildLegacyTicker } from "../assets/asset-normalization";
import { AssetsService, getEffectiveQuoteStatus } from "../assets/assets.service";
import { CreateDividendReceiptDto } from "./dto/create-dividend-receipt.dto";
import { CreatePortfolioDto } from "./dto/create-portfolio.dto";
import { CreatePortfolioTransactionDto } from "./dto/create-portfolio-transaction.dto";
import { ReceiveDividendReceiptDto } from "./dto/receive-dividend-receipt.dto";
import { calculatePosition, decimal } from "./portfolio-calculations";
import { PortfoliosRepository } from "./portfolios.repository";

const ZERO = new Prisma.Decimal(0);

const normalizeCurrency = (currency?: string | null) =>
  (currency?.trim().toUpperCase() || "BRL").slice(0, 8);

const toDecimalOrNull = (value?: string | null) =>
  value === undefined || value === null ? null : new Prisma.Decimal(value);

const asNumber = (value: Prisma.Decimal) => Number(value.toFixed(8));

const parseDateOnly = (value: string) => new Date(`${value}T00:00:00.000Z`);

const parseMonth = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 0));
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(monthNumber) ||
    monthNumber < 1 ||
    monthNumber > 12
  ) {
    throw new BadRequestException("Month must use YYYY-MM");
  }
  return { start, end };
};

const sumTransactions = (
  transactions: Array<{ totalAmount: Prisma.Decimal | string | number; type: string }>,
  types: string[],
) =>
  transactions
    .filter((transaction) => types.includes(transaction.type))
    .reduce(
      (total, transaction) => total.plus(decimal(transaction.totalAmount)),
      ZERO,
    );

const calculateRealizedGainByAsset = (
  transactions: Array<{
    id: string;
    assetId: string;
    type: "buy" | "sell" | "dividend" | "fee" | "manual_adjustment" | "opening_balance";
    quantity: Prisma.Decimal | null;
    unitPrice: Prisma.Decimal | null;
    totalAmount: Prisma.Decimal;
    fees: Prisma.Decimal;
    taxes: Prisma.Decimal;
    occurredAt: Date;
  }>,
) => {
  const byAsset = new Map<string, typeof transactions>();
  for (const transaction of transactions) {
    byAsset.set(transaction.assetId, [
      ...(byAsset.get(transaction.assetId) ?? []),
      transaction,
    ]);
  }

  return [...byAsset.values()].reduce(
    (total, assetTransactions) =>
      total.plus(
        calculatePosition(
          assetTransactions.map((transaction) => ({
            id: transaction.id,
            type: transaction.type,
            quantity: transaction.quantity,
            unitPrice: transaction.unitPrice,
            totalAmount: transaction.totalAmount,
            fees: transaction.fees,
            taxes: transaction.taxes,
            occurredAt: transaction.occurredAt,
          })),
        ).realizedGain,
      ),
    ZERO,
  );
};

@Injectable()
export class PortfoliosService {
  private readonly logger = new Logger(PortfoliosService.name);

  constructor(
    private readonly repository: PortfoliosRepository,
    private readonly assetsService: AssetsService,
  ) {}

  async findAll(userId: string) {
    await this.ensureDefaultAndMigrateLegacy(userId);
    return this.repository.findAllByUser(userId);
  }

  create(userId: string, dto: CreatePortfolioDto) {
    return this.repository.create(userId, {
      name: dto.name.trim(),
      isDefault: dto.isDefault ?? false,
    });
  }

  async addTransaction(
    userId: string,
    portfolioId: string,
    dto: CreatePortfolioTransactionDto,
  ) {
    const portfolio = await this.repository.findById(userId, portfolioId);
    assertResourceFound(portfolio, "Portfolio not found");

    const asset = await this.repository.findAsset(userId, dto.assetId);
    assertResourceFound(asset, "Asset not found");

    const quantity = toDecimalOrNull(dto.quantity);
    const unitPrice = toDecimalOrNull(dto.unitPrice);
    const fees = toDecimalOrNull(dto.fees) ?? ZERO;
    const taxes = toDecimalOrNull(dto.taxes) ?? ZERO;
    const grossAmount =
      quantity && unitPrice ? quantity.times(unitPrice) : toDecimalOrNull(dto.totalAmount);

    if (
      ["buy", "sell", "opening_balance"].includes(dto.type) &&
      (!quantity || quantity.lte(ZERO))
    ) {
      throw new BadRequestException("Quantity is required for this transaction");
    }

    const totalAmount =
      toDecimalOrNull(dto.totalAmount) ??
      (grossAmount
        ? dto.type === "sell"
          ? grossAmount.minus(fees).minus(taxes)
          : grossAmount.plus(fees).plus(taxes)
        : null);

    if (!totalAmount) {
      throw new BadRequestException("Total amount or quantity/unitPrice is required");
    }

    return this.repository.createTransaction(userId, portfolioId, {
      assetId: dto.assetId,
      type: dto.type,
      quantity,
      unitPrice,
      grossAmount,
      fees,
      taxes,
      totalAmount,
      currency: normalizeCurrency(dto.currency ?? asset.currency),
      occurredAt: new Date(dto.occurredAt),
      notes: dto.notes?.trim() || null,
    });
  }

  async getPositions(userId: string, portfolioId: string) {
    const portfolio = await this.repository.findById(userId, portfolioId);
    assertResourceFound(portfolio, "Portfolio not found");

    const transactions = await this.repository.findPortfolioTransactions(
      userId,
      portfolioId,
    );
    const byAsset = new Map<string, typeof transactions>();

    for (const transaction of transactions) {
      byAsset.set(transaction.assetId, [
        ...(byAsset.get(transaction.assetId) ?? []),
        transaction,
      ]);
    }

    return [...byAsset.values()]
      .map((assetTransactions) => {
        const asset = assetTransactions[0].asset;
        const latestQuote = asset.quotes[0] ?? null;
        const calculation = calculatePosition(
          assetTransactions.map((transaction) => ({
            id: transaction.id,
            type: transaction.type,
            quantity: transaction.quantity,
            unitPrice: transaction.unitPrice,
            totalAmount: transaction.totalAmount,
            fees: transaction.fees,
            taxes: transaction.taxes,
            occurredAt: transaction.occurredAt,
          })),
        );
        const quotePrice = latestQuote ? decimal(latestQuote.price) : ZERO;
        const currentValue = calculation.quantity.times(quotePrice);
        const unrealizedGain = currentValue.minus(calculation.costBasis);
        const totalGain = unrealizedGain.plus(calculation.dividends);
        const roi = calculation.costBasis.gt(ZERO)
          ? totalGain.dividedBy(calculation.costBasis).times(100)
          : ZERO;

        return {
          asset,
          quantity: asNumber(calculation.quantity),
          averagePrice: asNumber(calculation.averagePrice),
          costBasis: asNumber(calculation.costBasis),
          currentValue: asNumber(currentValue),
          dividends: asNumber(calculation.dividends),
          unrealizedGain: asNumber(unrealizedGain),
          realizedGain: asNumber(calculation.realizedGain),
          roi: asNumber(roi),
          latestQuote,
          audit: {
            formula: calculation.formula,
            eventCount: calculation.eventCount,
            quoteSource: latestQuote?.source ?? null,
            quoteStatus: getEffectiveQuoteStatus(latestQuote),
            quotedAt: latestQuote?.quotedAt ?? null,
          },
        };
      })
      .filter((position) => position.quantity !== 0 || position.costBasis !== 0);
  }

  async getAudit(userId: string, portfolioId: string) {
    const positions = await this.getPositions(userId, portfolioId);

    return {
      portfolioId,
      calculatedAt: new Date().toISOString(),
      formula:
        "ROI=(currentValue-costBasis+dividends)/costBasis; currentValue=quantity*latestQuote",
      positions: positions.map((position) => ({
        assetId: position.asset.id,
        ticker: position.asset.ticker,
        formula: position.audit.formula,
        eventCount: position.audit.eventCount,
        quoteSource: position.audit.quoteSource,
        quoteStatus: position.audit.quoteStatus,
        quotedAt: position.audit.quotedAt,
        result: {
          quantity: position.quantity,
          costBasis: position.costBasis,
          currentValue: position.currentValue,
          roi: position.roi,
        },
      })),
    };
  }

  async refreshQuotes(userId: string, portfolioId: string) {
    const portfolio = await this.repository.findById(userId, portfolioId);
    assertResourceFound(portfolio, "Portfolio not found");

    const transactions = await this.repository.findPortfolioTransactions(
      userId,
      portfolioId,
    );
    const assetIds = Array.from(
      new Set(transactions.map((transaction) => transaction.assetId)),
    );
    const results = [];

    for (const assetId of assetIds) {
      results.push(await this.assetsService.refreshQuote(userId, assetId));
    }

    return {
      portfolioId,
      updatedCount: results.filter((result) => !result.cacheHit && result.quote).length,
      staleCount: results.filter((result) => result.status === "stale").length,
      incompleteCount: results.filter((result) => result.status === "incomplete").length,
      results,
    };
  }

  async getDividends(userId: string, portfolioId: string) {
    const portfolio = await this.repository.findById(userId, portfolioId);
    assertResourceFound(portfolio, "Portfolio not found");

    return this.repository.findDividendReceipts(userId, portfolioId);
  }

  async createDividend(
    userId: string,
    portfolioId: string,
    dto: CreateDividendReceiptDto,
  ) {
    const portfolio = await this.repository.findById(userId, portfolioId);
    assertResourceFound(portfolio, "Portfolio not found");

    const asset = await this.repository.findAsset(userId, dto.assetId);
    assertResourceFound(asset, "Asset not found");

    const quantity = toDecimalOrNull(dto.quantity);
    const amountPerShare = new Prisma.Decimal(dto.amountPerShare);
    const taxes = toDecimalOrNull(dto.taxes) ?? ZERO;
    const grossAmount =
      toDecimalOrNull(dto.totalAmount) ??
      (quantity ? quantity.times(amountPerShare) : null);
    const totalAmount = grossAmount ? grossAmount.minus(taxes) : null;
    const source = dto.source?.trim() || "manual";
    const event = await this.repository.createDividendEvent(userId, {
      assetId: dto.assetId,
      source,
      status: dto.status ?? "announced",
      exDate: dto.exDate ? parseDateOnly(dto.exDate) : null,
      paymentDate: parseDateOnly(dto.paymentDate),
      amountPerShare,
      currency: normalizeCurrency(dto.currency ?? asset.currency),
      notes: dto.notes?.trim() || null,
    });

    return this.repository.createDividendReceipt(userId, portfolioId, {
      assetId: dto.assetId,
      dividendEventId: event.id,
      quantity,
      amountPerShare,
      grossAmount,
      taxes,
      totalAmount,
      currency: normalizeCurrency(dto.currency ?? asset.currency),
      exDate: dto.exDate ? parseDateOnly(dto.exDate) : null,
      paymentDate: parseDateOnly(dto.paymentDate),
      notes: dto.notes?.trim() || null,
      source,
    });
  }

  async receiveDividend(
    userId: string,
    portfolioId: string,
    receiptId: string,
    dto: ReceiveDividendReceiptDto,
  ) {
    const portfolio = await this.repository.findById(userId, portfolioId);
    assertResourceFound(portfolio, "Portfolio not found");

    const receipt = await this.repository.receiveDividendAtomically(
      userId,
      portfolioId,
      receiptId,
      (pendingReceipt) => {
        const quantity = toDecimalOrNull(dto.quantity) ?? pendingReceipt.quantity;
        const amountPerShare =
          toDecimalOrNull(dto.amountPerShare) ?? decimal(pendingReceipt.amountPerShare);
        const taxes = toDecimalOrNull(dto.taxes) ?? decimal(pendingReceipt.taxes);
        const explicitTotal = toDecimalOrNull(dto.totalAmount);
        const grossAmount =
          explicitTotal ??
          (quantity
            ? quantity.times(amountPerShare)
            : pendingReceipt.grossAmount);

        if (!grossAmount) {
          throw new BadRequestException(
            "Quantity/amount per share or total amount is required",
          );
        }

        const totalAmount = explicitTotal ?? decimal(grossAmount).minus(taxes);
        const receivedAt = dto.receivedAt
          ? parseDateOnly(dto.receivedAt)
          : pendingReceipt.paymentDate;
        const notes = dto.notes?.trim() || pendingReceipt.notes;

        return {
          transaction: {
            assetId: pendingReceipt.assetId,
            type: "dividend",
            quantity: null,
            unitPrice: amountPerShare,
            grossAmount: decimal(grossAmount),
            fees: ZERO,
            taxes,
            totalAmount,
            currency: pendingReceipt.currency,
            occurredAt: receivedAt,
            notes,
            source: "manual",
            sourceType: "manual",
          },
          receipt: {
            quantity,
            amountPerShare,
            grossAmount: decimal(grossAmount),
            taxes,
            totalAmount,
            receivedAt,
            notes,
          },
        };
      },
    );
    assertResourceFound(receipt, "Dividend receipt not found");

    if (receipt.status !== "received") {
      throw new BadRequestException("Dividend receipt is not pending");
    }

    return receipt;
  }

  async getMonthlyReport(userId: string, portfolioId: string, month: string) {
    const portfolio = await this.repository.findById(userId, portfolioId);
    assertResourceFound(portfolio, "Portfolio not found");

    const { start, end } = parseMonth(month);
    const beforeStart = new Date(start.getTime() - 24 * 60 * 60 * 1000);
    const [monthlyTransactions, transactionsUntilEnd, transactionsBeforeStart, dividends] =
      await Promise.all([
        this.repository.findPortfolioTransactionsBetween(userId, portfolioId, start, end),
        this.repository.findPortfolioTransactionsUntil(userId, portfolioId, end),
        this.repository.findPortfolioTransactionsUntil(
          userId,
          portfolioId,
          beforeStart,
        ),
        this.repository.findDividendReceiptsBetween(userId, portfolioId, start, end),
      ]);

    const byAsset = new Map<string, typeof transactionsUntilEnd>();
    for (const transaction of transactionsUntilEnd) {
      byAsset.set(transaction.assetId, [
        ...(byAsset.get(transaction.assetId) ?? []),
        transaction,
      ]);
    }

    let portfolioValue = ZERO;
    let staleQuotes = 0;
    let missingQuotes = 0;

    for (const assetTransactions of byAsset.values()) {
      const calculation = calculatePosition(
        assetTransactions.map((transaction) => ({
          id: transaction.id,
          type: transaction.type,
          quantity: transaction.quantity,
          unitPrice: transaction.unitPrice,
          totalAmount: transaction.totalAmount,
          fees: transaction.fees,
          taxes: transaction.taxes,
          occurredAt: transaction.occurredAt,
        })),
      );
      const latestQuote = assetTransactions[0].asset.quotes[0] ?? null;
      const status = getEffectiveQuoteStatus(latestQuote);
      if (status === "incomplete") missingQuotes += 1;
      if (status === "stale") staleQuotes += 1;
      portfolioValue = portfolioValue.plus(
        calculation.quantity.times(latestQuote ? decimal(latestQuote.price) : ZERO),
      );
    }

    const gainUntilEnd = calculateRealizedGainByAsset(transactionsUntilEnd);
    const gainBeforeStart = calculateRealizedGainByAsset(transactionsBeforeStart);
    const pendingDividends = dividends.filter(
      (dividend) => dividend.status === "pending",
    ).length;

    return {
      portfolioId,
      month,
      periodStart: start.toISOString().slice(0, 10),
      periodEnd: end.toISOString().slice(0, 10),
      contributions: asNumber(
        sumTransactions(monthlyTransactions, [
          "buy",
          "opening_balance",
          "manual_adjustment",
        ]),
      ),
      sales: asNumber(sumTransactions(monthlyTransactions, ["sell"])),
      dividendsReceived: asNumber(
        sumTransactions(monthlyTransactions, ["dividend"]),
      ),
      estimatedCapitalGain: asNumber(gainUntilEnd.minus(gainBeforeStart)),
      portfolioValue: asNumber(portfolioValue),
      transactionCount: monthlyTransactions.length,
      pendingData: {
        staleQuotes,
        missingQuotes,
        pendingDividends,
        hasPendingData: staleQuotes + missingQuotes + pendingDividends > 0,
      },
      dividends: dividends.map((dividend) => ({
        id: dividend.id,
        status: dividend.status,
        ticker: dividend.asset.ticker,
        paymentDate: dividend.paymentDate,
        totalAmount: dividend.totalAmount ? asNumber(decimal(dividend.totalAmount)) : null,
      })),
    };
  }

  private async ensureDefaultAndMigrateLegacy(userId: string) {
    const portfolio = await this.repository.ensureDefault(userId);
    const legacyInvestments = await this.repository.findLegacyInvestments(userId);

    for (const investment of legacyInvestments) {
      try {
        const migrated = await this.repository.findLegacyMigration(userId, investment.id);
        if (migrated) continue;

        const asset = await this.repository.upsertLegacyAsset(userId, {
          ticker: investment.assetSymbol ?? buildLegacyTicker(investment.id),
          name: investment.name,
          class: "custom",
          sector: investment.category,
          currency: investment.quoteCurrency ?? "BRL",
        });
        const quantity = new Prisma.Decimal(investment.quantity ?? 1);
        const openingAmount = new Prisma.Decimal(investment.investedAmount);

        await this.repository.createLegacyQuote(
          userId,
          asset.id,
          new Prisma.Decimal(investment.marketPrice ?? investment.currentValue),
        );
        await this.repository.createTransaction(userId, portfolio.id, {
          assetId: asset.id,
          type: "opening_balance",
          quantity,
          unitPrice: quantity.gt(ZERO) ? openingAmount.dividedBy(quantity) : openingAmount,
          grossAmount: openingAmount,
          fees: ZERO,
          taxes: ZERO,
          totalAmount: openingAmount,
          currency: investment.quoteCurrency ?? "BRL",
          occurredAt: investment.startDate ?? investment.createdAt,
          notes: investment.notes,
          source: "legacy_manual",
          sourceType: "legacy_manual",
          legacyInvestmentId: investment.id,
        });
      } catch (error) {
        this.logger.warn(
          `Skipping legacy investment migration ${investment.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }
}
