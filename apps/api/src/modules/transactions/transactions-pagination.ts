import { BadRequestException } from "@nestjs/common";

export type TransactionCursor = {
  date: Date;
  createdAt: Date;
  id: string;
};

type SerializedTransactionCursor = {
  version: 1;
  date: string;
  createdAt: string;
  id: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const parseIsoDate = (value: unknown) => {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== value) {
    return null;
  }
  return parsed;
};

export const encodeTransactionCursor = (cursor: TransactionCursor) => {
  const payload: SerializedTransactionCursor = {
    version: 1,
    date: cursor.date.toISOString(),
    createdAt: cursor.createdAt.toISOString(),
    id: cursor.id,
  };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
};

export const decodeTransactionCursor = (value: string): TransactionCursor => {
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<SerializedTransactionCursor>;
    const date = parseIsoDate(parsed.date);
    const createdAt = parseIsoDate(parsed.createdAt);
    if (
      parsed.version !== 1 ||
      !date ||
      !createdAt ||
      typeof parsed.id !== "string" ||
      !UUID_PATTERN.test(parsed.id)
    ) {
      throw new Error("Invalid cursor payload");
    }
    return { date, createdAt, id: parsed.id };
  } catch {
    throw new BadRequestException("Transaction cursor is invalid");
  }
};
