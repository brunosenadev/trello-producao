import { and, eq, gte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { advanceInstallments, financialTransactions, projects } from "@/lib/db/schema";
import { ensureOccurrencesForDate } from "@/lib/occurrences";
import { firstDayOfMonth, todayInBrazil, type DateOnly } from "@/lib/timezone";

export async function getOccurrencesForDateAcrossProjects(date: DateOnly) {
  const activeProjects = await db.query.projects.findMany({ where: eq(projects.isActive, true) });

  const results = await Promise.all(
    activeProjects.map(async (project) => {
      const occurrences = await ensureOccurrencesForDate(project.id, date);
      return occurrences.map((occurrence) => ({ ...occurrence, projectName: project.name }));
    }),
  );

  return results.flat();
}

/**
 * O Brasil não usa mais horário de verão desde 2019, então o offset
 * -03:00 é fixo o ano inteiro — não precisamos de uma lib de timezone só
 * para achar o início do mês em UTC.
 */
export async function getMonthGeneratedCents(userId?: string) {
  const monthStart = firstDayOfMonth(todayInBrazil());
  const conditions = [
    eq(financialTransactions.type, "TASK_EARNING"),
    gte(financialTransactions.createdAt, new Date(`${monthStart}T00:00:00-03:00`)),
  ];
  if (userId) conditions.push(eq(financialTransactions.userId, userId));

  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${financialTransactions.amountCents}), 0)` })
    .from(financialTransactions)
    .where(and(...conditions));

  // Linhas de TASK_EARNING são armazenadas negativas (consomem o saldo de
  // adiantamento) — aqui queremos a magnitude gerada, não o efeito no saldo.
  return Math.abs(Number(row?.total ?? 0));
}

export async function getUpcomingInstallments(limit = 5) {
  return db.query.advanceInstallments.findMany({
    where: eq(advanceInstallments.status, "PLANEJADA"),
    orderBy: (i, { asc }) => [asc(i.referenceMonth)],
    limit,
    with: { advance: { with: { user: true } } },
  });
}
