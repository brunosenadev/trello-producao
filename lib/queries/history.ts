import { and, desc, eq, gte, lte } from "drizzle-orm";

import { db } from "@/lib/db";
import { taskOccurrences } from "@/lib/db/schema";

export type HistoryFilters = {
  projectId?: string;
  assignedUserId?: string;
  startDate?: string;
  endDate?: string;
  status?: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA" | "BLOQUEADA";
};

export async function getOccurrenceHistory(filters: HistoryFilters, limit = 300) {
  const conditions = [];
  if (filters.projectId) conditions.push(eq(taskOccurrences.projectId, filters.projectId));
  if (filters.assignedUserId)
    conditions.push(eq(taskOccurrences.assignedUserId, filters.assignedUserId));
  if (filters.startDate) conditions.push(gte(taskOccurrences.occurrenceDate, filters.startDate));
  if (filters.endDate) conditions.push(lte(taskOccurrences.occurrenceDate, filters.endDate));
  if (filters.status) conditions.push(eq(taskOccurrences.status, filters.status));

  return db.query.taskOccurrences.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(taskOccurrences.occurrenceDate)],
    limit,
    with: {
      taskTemplate: true,
      project: true,
      assignedUser: true,
      completedByUser: true,
    },
  });
}
