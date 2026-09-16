import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { projects, taskTemplates } from "@/lib/db/schema";

export async function listProjects() {
  const rows = await db.query.projects.findMany({
    with: { assignedUser: true, owner: true },
    orderBy: (p, { desc }) => [desc(p.isActive), desc(p.createdAt)],
  });
  return rows;
}

export async function getProject(projectId: string) {
  return db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: { assignedUser: true, owner: true },
  });
}

export async function getProjectTemplates(projectId: string, onlyActive = false) {
  const rows = await db.query.taskTemplates.findMany({
    where: onlyActive
      ? (t, { and, eq }) => and(eq(t.projectId, projectId), eq(t.isActive, true))
      : eq(taskTemplates.projectId, projectId),
    with: { checklistTemplates: { orderBy: (i, { asc }) => [asc(i.order)] } },
  });
  return rows.sort((a, b) => a.order - b.order);
}

export async function getTaskTemplate(templateId: string) {
  return db.query.taskTemplates.findFirst({
    where: eq(taskTemplates.id, templateId),
    with: { checklistTemplates: { orderBy: (i, { asc }) => [asc(i.order)] } },
  });
}
