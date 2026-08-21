/**
 * Materializes missing monthly occurrences from recurring transaction templates
 * so reads always include up-to-date recurring entries up to today.
 */
import { Injectable } from "@nestjs/common";
import { TransactionsRepository } from "./transactions.repository";
import { TtlCache } from "../../common/cache/ttl-cache";

const RECENT_RUNS_MAX_USERS = 10_000;

const clampDay = (year: number, monthIndex: number, day: number) => {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return Math.min(day, lastDay);
};

const buildDate = (year: number, monthIndex: number, day: number) =>
  new Date(Date.UTC(year, monthIndex, clampDay(year, monthIndex, day)));

type RecurringTemplate = Awaited<
  ReturnType<TransactionsRepository["findRecurringTemplates"]>
>[number];

type RecurringGenerationPlan = {
  template: RecurringTemplate;
  dates: Date[];
};

const getMissingMonthlyDates = (
  lastDate: Date,
  templateDay: number,
  limitDate: Date,
) => {
  let nextYear = lastDate.getUTCFullYear();
  let nextMonth = lastDate.getUTCMonth() + 1;
  if (nextMonth > 11) {
    nextMonth = 0;
    nextYear += 1;
  }

  const dates: Date[] = [];
  while (true) {
    const candidate = buildDate(nextYear, nextMonth, templateDay);
    if (candidate > limitDate) {
      break;
    }
    dates.push(candidate);
    nextMonth += 1;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
  }
  return dates;
};

@Injectable()
export class RecurringTransactionsService {
  private readonly recentRuns = new TtlCache<string, true>(
    30_000,
    RECENT_RUNS_MAX_USERS,
  );
  private readonly inFlightByUser = new Map<string, Promise<{ generated: number }>>();

  constructor(private readonly repository: TransactionsRepository) {}

  private runOrJoinGeneration(userId: string) {
    const inFlight = this.inFlightByUser.get(userId);
    if (inFlight) {
      return inFlight;
    }

    const task = this.generateMissingRecurringTransactions(userId).finally(() => {
      this.inFlightByUser.delete(userId);
    });
    this.inFlightByUser.set(userId, task);
    return task;
  }

  private async buildGenerationPlan(
    userId: string,
    template: RecurringTemplate,
    todayStart: Date,
  ): Promise<RecurringGenerationPlan | null> {
    const lastDate = await this.repository.findLastOccurrenceDate(userId, template.id);
    if (!lastDate) {
      return null;
    }

    const dates = getMissingMonthlyDates(
      lastDate,
      template.date.getUTCDate(),
      todayStart,
    );
    if (dates.length === 0) {
      return null;
    }

    return { template, dates };
  }

  private async generateMissingRecurringTransactions(userId: string) {
    const templates = await this.repository.findRecurringTemplates(userId);
    if (templates.length === 0) {
      this.recentRuns.set(userId, true);
      return { generated: 0 };
    }

    const today = new Date();
    const todayStart = new Date(
      Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth(),
        today.getUTCDate(),
      ),
    );

    const plans = (
      await Promise.all(
        templates.map((template) =>
          this.buildGenerationPlan(userId, template, todayStart),
        ),
      )
    ).filter((plan): plan is RecurringGenerationPlan => Boolean(plan));

    if (plans.length === 0) {
      this.recentRuns.set(userId, true);
      return { generated: 0 };
    }

    const results = await Promise.all(
      plans.map((plan) =>
        this.repository.createRecurringOccurrences(userId, plan.template, plan.dates),
      ),
    );
    const generated = results.reduce((total, result) => total + result.count, 0);
    this.recentRuns.set(userId, true);
    return { generated };
  }

  async ensureRecurringTransactions(userId: string) {
    if (this.recentRuns.get(userId)) {
      return { generated: 0 };
    }
    return this.runOrJoinGeneration(userId);
  }
}
