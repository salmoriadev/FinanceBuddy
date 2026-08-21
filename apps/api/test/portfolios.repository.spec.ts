import { Prisma } from "@prisma/client";
import { PrismaService } from "../src/database/prisma.service";
import { PortfoliosRepository } from "../src/modules/portfolios/portfolios.repository";

const dec = (value: string | number) => new Prisma.Decimal(value);

const pendingReceipt = {
  id: "receipt-1",
  userId: "user-1",
  portfolioId: "portfolio-1",
  assetId: "asset-1",
  dividendEventId: "event-1",
  status: "pending",
  quantity: dec(10),
  amountPerShare: dec("1.25"),
  grossAmount: null,
  taxes: dec(0),
  totalAmount: null,
  currency: "BRL",
  exDate: null,
  paymentDate: new Date("2026-05-20"),
  receivedAt: null,
  transactionId: null,
  notes: null,
  source: "manual",
  sourceType: "manual",
  createdAt: new Date("2026-05-01"),
  updatedAt: new Date("2026-05-01"),
  asset: { id: "asset-1" },
  event: { id: "event-1" },
};

const preparedDividend = {
  transaction: {
    assetId: "asset-1",
    type: "dividend" as const,
    quantity: null,
    unitPrice: dec("1.25"),
    grossAmount: dec("12.5"),
    fees: dec(0),
    taxes: dec(0),
    totalAmount: dec("12.5"),
    currency: "BRL",
    occurredAt: new Date("2026-05-20"),
  },
  receipt: {
    quantity: dec(10),
    amountPerShare: dec("1.25"),
    grossAmount: dec("12.5"),
    taxes: dec(0),
    totalAmount: dec("12.5"),
    receivedAt: new Date("2026-05-20"),
  },
};

describe("PortfoliosRepository.receiveDividendAtomically", () => {
  it("allows only one concurrent pending-to-received claimant to create a ledger entry", async () => {
    const receivedReceipt = {
      ...pendingReceipt,
      status: "received",
      transactionId: "tx-1",
    };
    const transactionClient = {
      portfolioDividendReceipt: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(pendingReceipt)
          .mockResolvedValueOnce(pendingReceipt)
          .mockResolvedValueOnce(receivedReceipt),
        updateMany: jest
          .fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 0 }),
        update: jest.fn().mockResolvedValue(receivedReceipt),
      },
      portfolioTransaction: {
        create: jest.fn().mockResolvedValue({ id: "tx-1" }),
      },
      dividendEvent: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(transactionClient)),
    } as unknown as PrismaService;
    const repository = new PortfoliosRepository(prisma);
    const prepare = jest.fn(() => preparedDividend);

    const [first, second] = await Promise.all([
      repository.receiveDividendAtomically(
        "user-1",
        "portfolio-1",
        "receipt-1",
        prepare as never,
      ),
      repository.receiveDividendAtomically(
        "user-1",
        "portfolio-1",
        "receipt-1",
        prepare as never,
      ),
    ]);

    expect(first).toEqual(receivedReceipt);
    expect(second).toEqual(receivedReceipt);
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(transactionClient.portfolioTransaction.create).toHaveBeenCalledTimes(1);
    expect(transactionClient.portfolioDividendReceipt.update).toHaveBeenCalledTimes(1);
    expect(transactionClient.portfolioDividendReceipt.updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        portfolioId: "portfolio-1",
        id: "receipt-1",
        status: "pending",
      },
      data: { status: "received" },
    });
  });

  it("rolls back a failed ledger write so the receipt can be retried without an orphan", async () => {
    let committed = {
      status: "pending",
      transactionId: null as string | null,
      ledgerIds: [] as string[],
    };
    let failLedgerWrite = true;
    const prisma = {
      $transaction: jest.fn(async (callback) => {
        const draft = {
          status: committed.status,
          transactionId: committed.transactionId,
          ledgerIds: [...committed.ledgerIds],
        };
        const transactionClient = {
          portfolioDividendReceipt: {
            findFirst: jest.fn(async () => ({
              ...pendingReceipt,
              status: draft.status,
              transactionId: draft.transactionId,
            })),
            updateMany: jest.fn(async () => {
              if (draft.status !== "pending") return { count: 0 };
              draft.status = "received";
              return { count: 1 };
            }),
            update: jest.fn(async ({ data }) => {
              draft.transactionId = data.transactionId;
              return {
                ...pendingReceipt,
                status: draft.status,
                transactionId: draft.transactionId,
              };
            }),
          },
          portfolioTransaction: {
            create: jest.fn(async () => {
              if (failLedgerWrite) throw new Error("ledger unavailable");
              draft.ledgerIds.push("tx-1");
              return { id: "tx-1" };
            }),
          },
          dividendEvent: {
            updateMany: jest.fn(async () => ({ count: 1 })),
          },
        };

        const result = await callback(transactionClient);
        committed = draft;
        return result;
      }),
    } as unknown as PrismaService;
    const repository = new PortfoliosRepository(prisma);

    await expect(
      repository.receiveDividendAtomically(
        "user-1",
        "portfolio-1",
        "receipt-1",
        () => preparedDividend,
      ),
    ).rejects.toThrow("ledger unavailable");
    expect(committed).toEqual({
      status: "pending",
      transactionId: null,
      ledgerIds: [],
    });

    failLedgerWrite = false;
    await expect(
      repository.receiveDividendAtomically(
        "user-1",
        "portfolio-1",
        "receipt-1",
        () => preparedDividend,
      ),
    ).resolves.toEqual(expect.objectContaining({
      status: "received",
      transactionId: "tx-1",
    }));
    expect(committed).toEqual({
      status: "received",
      transactionId: "tx-1",
      ledgerIds: ["tx-1"],
    });
  });
});
