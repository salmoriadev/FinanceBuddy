import { Injectable } from "@nestjs/common";
import { FixedIncomeIndexer, Prisma } from "@prisma/client";

type BcbObservation = {
  data?: string;
  valor?: string;
};

type RateObservation = {
  date: Date;
  rate: Prisma.Decimal;
};

type FixedIncomeTerms = {
  indexer: FixedIncomeIndexer;
  rate: Prisma.Decimal;
  baseDate: Date;
};

const ONE = new Prisma.Decimal(1);
const DAY_MS = 24 * 60 * 60 * 1000;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 32;
const SERIES = { cdi: 12, ipca: 433 } as const;

const asUtcDate = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const formatBcbDate = (date: Date) =>
  `${String(date.getUTCDate()).padStart(2, "0")}/${String(
    date.getUTCMonth() + 1,
  ).padStart(2, "0")}/${date.getUTCFullYear()}`;

const parseBcbDate = (value: string | undefined) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value ?? "");
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])));
  return Number.isNaN(date.getTime()) ? null : date;
};

const compoundAnnualRate = (
  annualRatePercent: Prisma.Decimal,
  from: Date,
  to: Date,
) => {
  const days = Math.max(0, Math.floor((asUtcDate(to).getTime() - asUtcDate(from).getTime()) / DAY_MS));
  return ONE.plus(annualRatePercent.dividedBy(100)).pow(days / 365);
};

@Injectable()
export class FixedIncomeValuationService {
  private readonly cache = new Map<
    string,
    { expiresAt: number; observations: RateObservation[] }
  >();

  async factorAt(terms: FixedIncomeTerms, valuationDate: Date) {
    const baseDate = asUtcDate(terms.baseDate);
    const targetDate = asUtcDate(valuationDate);
    if (targetDate < baseDate) {
      throw new Error("Fixed-income valuation date precedes its base date");
    }
    if (targetDate.getTime() === baseDate.getTime()) return ONE;

    if (terms.indexer === "fixed") {
      return compoundAnnualRate(terms.rate, baseDate, targetDate);
    }

    const observations = await this.getSeries(
      SERIES[terms.indexer],
      baseDate,
      targetDate,
    );

    if (terms.indexer === "cdi") {
      const benchmarkShare = terms.rate.dividedBy(100);
      return observations
        .filter(({ date }) => date > baseDate && date <= targetDate)
        .reduce(
          (factor, { rate }) =>
            factor.times(ONE.plus(rate.dividedBy(100).times(benchmarkShare))),
          ONE,
        );
    }

    const baseMonth = new Date(
      Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), 1),
    );
    const targetMonth = new Date(
      Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), 1),
    );
    const inflationFactor = observations
      .filter(({ date }) => date > baseMonth && date <= targetMonth)
      .reduce(
        (factor, { rate }) => factor.times(ONE.plus(rate.dividedBy(100))),
        ONE,
      );

    return inflationFactor.times(
      compoundAnnualRate(terms.rate, baseDate, targetDate),
    );
  }

  providerFor(indexer: FixedIncomeIndexer) {
    return indexer === "fixed" ? "financebuddy-fixed-rate" : "bcb-sgs";
  }

  private async getSeries(series: number, start: Date, end: Date) {
    const observations: RateObservation[] = [];
    let chunkStart = asUtcDate(start);

    while (chunkStart <= end) {
      const chunkEnd = new Date(
        Date.UTC(chunkStart.getUTCFullYear() + 9, chunkStart.getUTCMonth(), chunkStart.getUTCDate()),
      );
      const boundedEnd = chunkEnd < end ? chunkEnd : asUtcDate(end);
      observations.push(...(await this.fetchSeriesChunk(series, chunkStart, boundedEnd)));
      chunkStart = new Date(boundedEnd.getTime() + DAY_MS);
    }

    return observations;
  }

  private async fetchSeriesChunk(series: number, start: Date, end: Date) {
    const cacheKey = `${series}:${start.toISOString().slice(0, 10)}:${end
      .toISOString()
      .slice(0, 10)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.observations;

    const params = new URLSearchParams({
      formato: "json",
      dataInicial: formatBcbDate(start),
      dataFinal: formatBcbDate(end),
    });
    const response = await fetch(
      `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${series}/dados?${params.toString()}`,
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8_000) },
    );
    if (!response.ok) throw new Error(`Banco Central returned ${response.status}`);

    const payload = (await response.json()) as BcbObservation[];
    if (!Array.isArray(payload)) throw new Error("Banco Central returned invalid data");
    const observations = payload
      .map((entry) => {
        const date = parseBcbDate(entry.data);
        const numeric = Number((entry.valor ?? "").replace(",", "."));
        return date && Number.isFinite(numeric)
          ? { date, rate: new Prisma.Decimal(numeric) }
          : null;
      })
      .filter((entry): entry is RateObservation => Boolean(entry));

    if (this.cache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = this.cache.keys().next().value as string | undefined;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      observations,
    });
    return observations;
  }
}
