import { Prisma } from "@prisma/client";

type DecimalInput = Prisma.Decimal | number | string | null | undefined;

export type PositionInputTransaction = {
  id: string;
  type: "buy" | "sell" | "dividend" | "fee" | "manual_adjustment" | "opening_balance";
  quantity?: DecimalInput;
  unitPrice?: DecimalInput;
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
    const totalAmount = decimal(transaction.totalAmount);
    const fees = decimal(transaction.fees);
    const taxes = decimal(transaction.taxes);

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
      realizedGain = realizedGain.plus(
        totalAmount.minus(releasedCost).minus(fees).minus(taxes),
      );
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
      "quantity=sum(buy/opening/adjustment quantities)-sum(sell quantities); costBasis=sum(cost events)-averageCostOfSoldQuantity; currentValue=quantity*latestQuote",
  };
};
