import { Prisma } from "@prisma/client";

type DecimalInput = Prisma.Decimal | number | string | null | undefined;

export type PositionInputTransaction = {
  id: string;
  type: "buy" | "sell" | "dividend" | "fee" | "manual_adjustment" | "opening_balance";
  quantity?: DecimalInput;
  unitPrice?: DecimalInput;
  grossAmount?: DecimalInput;
  /**
   * Recorded total. Current rows store effective cash; compatibility logic
   * derives it from gross audit fields for rows written under the old contract.
   */
  totalAmount: DecimalInput;
  fees?: DecimalInput;
  taxes?: DecimalInput;
  occurredAt: Date;
};

export type PositionCalculation = {
  quantity: Prisma.Decimal;
  costBasis: Prisma.Decimal;
  averagePrice: Prisma.Decimal;
  dividends: Prisma.Decimal;
  realizedGain: Prisma.Decimal;
  eventCount: number;
  formula: string;
};

const ZERO = new Prisma.Decimal(0);

export const decimal = (value: DecimalInput) =>
  value === undefined || value === null ? ZERO : new Prisma.Decimal(value);

const isPositive = (value: Prisma.Decimal) => value.gt(ZERO);

/**
 * Derives the effective cash value from immutable audit fields when available.
 * This keeps rows written with the former gross `totalAmount` contract and rows
 * written with the current net/effective contract financially equivalent.
 * Custom events and rows without a gross amount keep their recorded total.
 */
export const effectiveCashAmount = (
  transaction: Pick<
    PositionInputTransaction,
    "type" | "grossAmount" | "totalAmount" | "fees" | "taxes"
  >,
) => {
  if (transaction.grossAmount === undefined || transaction.grossAmount === null) {
    return decimal(transaction.totalAmount);
  }

  const grossAmount = decimal(transaction.grossAmount);
  const costs = decimal(transaction.fees).plus(decimal(transaction.taxes));

  if (transaction.type === "buy" || transaction.type === "opening_balance") {
    return grossAmount.plus(costs);
  }

  if (transaction.type === "sell" || transaction.type === "dividend") {
    return grossAmount.minus(costs);
  }

  return decimal(transaction.totalAmount);
};

export const calculatePosition = (
  transactions: PositionInputTransaction[],
): PositionCalculation => {
  let quantity = ZERO;
  let costBasis = ZERO;
  let dividends = ZERO;
  let realizedGain = ZERO;

  for (const transaction of [...transactions].sort(
    (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
  )) {
    const transactionQuantity = decimal(transaction.quantity);
    const totalAmount = effectiveCashAmount(transaction);
    if (transaction.type === "buy" || transaction.type === "opening_balance") {
      quantity = quantity.plus(transactionQuantity);
      costBasis = costBasis.plus(totalAmount);
    }

    if (transaction.type === "sell" && isPositive(transactionQuantity)) {
      const averageBeforeSale = isPositive(quantity)
        ? costBasis.dividedBy(quantity)
        : ZERO;
      const releasedCost = averageBeforeSale.times(transactionQuantity);
      quantity = quantity.minus(transactionQuantity);
      costBasis = costBasis.minus(releasedCost);
      realizedGain = realizedGain.plus(totalAmount.minus(releasedCost));
    }

    if (transaction.type === "dividend") {
      dividends = dividends.plus(totalAmount);
    }

    if (transaction.type === "fee") {
      costBasis = costBasis.plus(totalAmount);
    }

    if (transaction.type === "manual_adjustment") {
      quantity = quantity.plus(transactionQuantity);
      costBasis = costBasis.plus(totalAmount);
    }
  }

  const averagePrice = isPositive(quantity) ? costBasis.dividedBy(quantity) : ZERO;

  return {
    quantity,
    costBasis,
    averagePrice,
    dividends,
    realizedGain,
    eventCount: transactions.length,
    formula:
      "quantity=sum(buy/opening/adjustment quantities)-sum(sell quantities); effectiveCash=grossAmount adjusted by fees/taxes when available; costBasis=sum(cost events)-averageCostOfSoldQuantity; currentValue=quantity*latestQuote",
  };
};
