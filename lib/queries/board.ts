import { and, eq, gte, inArray, lte } from "drizzle-orm";

import { db } from "@/lib/db";
import { projects, taskOccurrenceChecklistItems, taskOccurrences } from "@/lib/db/schema";
import { templateAppliesOnDate } from "@/lib/occurrences";
import { addDaysToDate, type DateOnly } from "@/lib/timezone";

/**
 * Dados do quadro Kanban: todos os projetos ativos como colunas, com as
 * ocorrências de uma janela de datas (passado recente + futuro próximo).
 *
 * Ao contrário de `ensureOccurrencesForDate` (que gera um projeto/data por
 * vez, sob demanda), aqui geramos a janela inteira em lote — poucas
 * queries no total, não uma por dia por projeto. Ainda não depende de
 * cron: acontece só quando alguém abre o quadro.
 */
export async function getBoardData(windowStart: DateOnly, windowEnd: DateOnly) {
  const activeProjects = await db.query.projects.findMany({
    where: eq(projects.isActive, true),
    orderBy: (p, { asc }) => [asc(p.createdAt)],
    with: {
      taskTemplates: {
        where: (t, { eq }) => eq(t.isActive, true),
        with: { checklistTemplates: { orderBy: (i, { asc }) => [asc(i.order)] } },
      },
    },
  });

  const dates: DateOnly[] = [];
  for (let date = windowStart; date <= windowEnd; date = addDaysToDate(date, 1)) {
    dates.push(date);
  }

  const rowsToInsert: {
    taskTemplateId: string;
    projectId: string;
    occurrenceDate: string;
    amountCents: number;
    assignedUserId: string | null;
  }[] = [];
  const checklistByTemplateId = new Map<string, { label: string; order: number }[]>();

  for (const project of activeProjects) {
    for (const template of project.taskTemplates) {
      checklistByTemplateId.set(template.id, template.checklistTemplates);
      for (const date of dates) {
        if (templateAppliesOnDate(template, date)) {
          rowsToInsert.push({
            taskTemplateId: template.id,
            projectId: project.id,
            occurrenceDate: date,
            amountCents: template.amountCents,
            assignedUserId: project.assignedUserId,
          });
        }
      }
    }
  }

  if (rowsToInsert.length > 0) {
    const inserted = await db
      .insert(taskOccurrences)
      .values(rowsToInsert)
      .onConflictDoNothing({
        target: [taskOccurrences.taskTemplateId, taskOccurrences.occurrenceDate],
      })
      .returning({
        id: taskOccurrences.id,
        taskTemplateId: taskOccurrences.taskTemplateId,
      });

    const checklistRows = inserted.flatMap((row) =>
      (checklistByTemplateId.get(row.taskTemplateId) ?? []).map((item) => ({
        taskOccurrenceId: row.id,
        label: item.label,
        order: item.order,
      })),
    );

    if (checklistRows.length > 0) {
      await db.insert(taskOccurrenceChecklistItems).values(checklistRows);
    }
  }

  const projectIds = activeProjects.map((p) => p.id);
  const occurrences =
    projectIds.length > 0
      ? await db.query.taskOccurrences.findMany({
          where: and(
            inArray(taskOccurrences.projectId, projectIds),
            gte(taskOccurrences.occurrenceDate, windowStart),
            lte(taskOccurrences.occurrenceDate, windowEnd),
          ),
          with: {
            taskTemplate: true,
            checklistItems: { orderBy: (i, { asc }) => [asc(i.order)] },
            assignedUser: true,
            completedByUser: true,
          },
        })
      : [];

  const occurrencesByProject = new Map<string, typeof occurrences>();
  for (const occurrence of occurrences) {
    const list = occurrencesByProject.get(occurrence.projectId) ?? [];
    list.push(occurrence);
    occurrencesByProject.set(occurrence.projectId, list);
  }

  return activeProjects.map((project) => ({
    project,
    occurrences: (occurrencesByProject.get(project.id) ?? []).sort((a, b) => {
      if (a.occurrenceDate !== b.occurrenceDate) {
        return a.occurrenceDate < b.occurrenceDate ? -1 : 1;
      }
      return a.taskTemplate.order - b.taskTemplate.order;
    }),
  }));
}
