import { Injectable } from "@nestjs/common";
import { TransactionsRepository } from "./transactions.repository";

const clampDay = (year: number, monthIndex: number, day: number) => {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(day, lastDay);
};

const buildDate = (year: number, monthIndex: number, day: number) =>
  new Date(year, monthIndex, clampDay(year, monthIndex, day));

@Injectable()
export class RecurringTransactionsService {
  constructor(private readonly repository: TransactionsRepository) {}

  async ensureRecurringTransactions(userId: string) {
    const templates = await this.repository.findRecurringTemplates(userId);
    if (templates.length === 0) {
      return { generated: 0 };
    }

    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    let generated = 0;

    for (const template of templates) {
      const lastDate = await this.repository.findLastOccurrenceDate(
        userId,
        template.id,
      );
      if (!lastDate) continue;

      const templateDay = template.date.getDate();
      let nextYear = lastDate.getFullYear();
      let nextMonth = lastDate.getMonth() + 1;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear += 1;
      }

      const dates: Date[] = [];
      while (true) {
        const candidate = buildDate(nextYear, nextMonth, templateDay);
        if (candidate > todayStart) break;
        dates.push(candidate);
        nextMonth += 1;
        if (nextMonth > 11) {
          nextMonth = 0;
          nextYear += 1;
        }
      }

      if (dates.length > 0) {
        await this.repository.createRecurringOccurrences(userId, template, dates);
        generated += dates.length;
      }
    }

    return { generated };
  }
}
