import { and, eq, gte, lte } from "drizzle-orm";

import { db } from "@/lib/db";
import { projects, taskOccurrences } from "@/lib/db/schema";
import { templateAppliesOnDate } from "@/lib/occurrences";
import { addDaysToDate, type DateOnly } from "@/lib/timezone";

export type CalendarDaySummary = {
  date: DateOnly;
  expectedCount: number;
  completedCount: number;
  generatedCents: number;
  hasOverdue: boolean;
};

/**
 * Resumo do mês para o calendário. Não força a criação de ocorrências —
 * dias futuros/ainda não visitados usam a contagem "esperada" calculada a
 * partir dos templates ativos; dias já visitados usam os dados reais das
 * ocorrências (status, valor gerado).
 */
export async function getCalendarMonthSummary(
  monthStart: DateOnly,
  monthEnd: DateOnly,
  today: DateOnly,
): Promise<CalendarDaySummary[]> {
  const activeProjects = await db.query.projects.findMany({
    where: eq(projects.isActive, true),
    with: {
      taskTemplates: { where: (t, { eq }) => eq(t.isActive, true) },
    },
  });

  const activeTemplates = activeProjects.flatMap((project) => project.taskTemplates);

  const occurrences = await db.query.taskOccurrences.findMany({
    where: and(
      gte(taskOccurrences.occurrenceDate, monthStart),
      lte(taskOccurrences.occurrenceDate, monthEnd),
    ),
  });

  const occurrencesByDate = new Map<string, typeof occurrences>();
  for (const occurrence of occurrences) {
    const list = occurrencesByDate.get(occurrence.occurrenceDate) ?? [];
    list.push(occurrence);
    occurrencesByDate.set(occurrence.occurrenceDate, list);
  }

  const days: CalendarDaySummary[] = [];
  for (let date = monthStart; date <= monthEnd; date = addDaysToDate(date, 1)) {
    const expectedCount = activeTemplates.filter((template) =>
      templateAppliesOnDate(template, date),
    ).length;
    const dayOccurrences = occurrencesByDate.get(date) ?? [];
    const completedOccurrences = dayOccurrences.filter((o) => o.status === "CONCLUIDA");

    days.push({
      date,
      expectedCount,
      completedCount: completedOccurrences.length,
      generatedCents: completedOccurrences.reduce((sum, o) => sum + o.amountCents, 0),
      hasOverdue: date < today && completedOccurrences.length < expectedCount,
    });
  }

  return days;
}
