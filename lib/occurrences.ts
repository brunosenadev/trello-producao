import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  projects,
  taskOccurrenceChecklistItems,
  taskOccurrences,
  taskTemplates,
} from "@/lib/db/schema";
import { type DateOnly, weekdayOf } from "@/lib/timezone";

type TemplateForFrequencyCheck = {
  frequency: "DIARIA" | "DIAS_SEMANA" | "DESATIVADA";
  weekDays: number[] | null;
};

export function templateAppliesOnDate(
  template: TemplateForFrequencyCheck,
  date: DateOnly,
): boolean {
  switch (template.frequency) {
    case "DIARIA":
      return true;
    case "DIAS_SEMANA":
      return template.weekDays?.includes(weekdayOf(date)) ?? false;
    case "DESATIVADA":
    default:
      return false;
  }
}

/**
 * Garante que as ocorrências do dia existam para todos os templates ativos
 * do projeto elegíveis naquela data (upsert idempotente — regra #21: nunca
 * duplica mesmo sob acesso concorrente, graças ao unique index em
 * (taskTemplateId, occurrenceDate) + ON CONFLICT DO NOTHING) e retorna as
 * ocorrências do dia já carregadas com checklist.
 */
export async function ensureOccurrencesForDate(projectId: string, date: DateOnly) {
  const [project, templates] = await Promise.all([
    db.query.projects.findFirst({ where: eq(projects.id, projectId) }),
    db.query.taskTemplates.findMany({
      where: and(eq(taskTemplates.projectId, projectId), eq(taskTemplates.isActive, true)),
      with: {
        checklistTemplates: { orderBy: (t, { asc }) => [asc(t.order)] },
      },
    }),
  ]);

  if (!project) throw new Error("Projeto não encontrado.");

  // Projeto inativo não gera novas ocorrências, mas o histórico continua
  // disponível (regra #9: excluir/desativar não apaga o que já existe).
  const eligible = project.isActive
    ? templates.filter((template) => templateAppliesOnDate(template, date))
    : [];

  for (const template of eligible) {
    await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(taskOccurrences)
        .values({
          taskTemplateId: template.id,
          projectId,
          occurrenceDate: date,
          amountCents: template.amountCents,
          assignedUserId: project.assignedUserId,
        })
        .onConflictDoNothing({
          target: [taskOccurrences.taskTemplateId, taskOccurrences.occurrenceDate],
        })
        .returning({ id: taskOccurrences.id });

      const created = inserted[0];
      if (created && template.checklistTemplates.length > 0) {
        await tx.insert(taskOccurrenceChecklistItems).values(
          template.checklistTemplates.map((item) => ({
            taskOccurrenceId: created.id,
            label: item.label,
            order: item.order,
          })),
        );
      }
    });
  }

  return getOccurrencesForDate(projectId, date);
}

export { occurrenceDisplayTitle } from "@/lib/occurrence-display";

export async function getOccurrencesForDate(projectId: string, date: DateOnly) {
  const occurrences = await db.query.taskOccurrences.findMany({
    where: and(eq(taskOccurrences.projectId, projectId), eq(taskOccurrences.occurrenceDate, date)),
    with: {
      taskTemplate: true,
      checklistItems: { orderBy: (i, { asc }) => [asc(i.order)] },
      assignedUser: true,
      completedByUser: true,
    },
  });

  return occurrences.sort((a, b) => a.taskTemplate.order - b.taskTemplate.order);
}
