"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { taskChecklistTemplates, taskTemplates } from "@/lib/db/schema";
import { brlToCents } from "@/lib/money";
import { requireUser } from "@/lib/session";

const templateSchema = z.object({
  title: z.string().trim().min(1, "Título é obrigatório").max(200),
  amount: z.string().trim().min(1),
  frequency: z.enum(["DIARIA", "DIAS_SEMANA", "DESATIVADA"]),
  weekDays: z.string().optional(),
  checklist: z.string().optional(),
});

function parseTemplateForm(formData: FormData) {
  const parsed = templateSchema.parse({
    title: formData.get("title"),
    amount: formData.get("amount"),
    frequency: formData.get("frequency"),
    weekDays: (formData.get("weekDays") as string) || undefined,
    checklist: (formData.get("checklist") as string) || undefined,
  });

  const weekDays =
    parsed.frequency === "DIAS_SEMANA"
      ? (z.array(z.number().int().min(0).max(6)).parse(JSON.parse(parsed.weekDays || "[]")) ?? [])
      : null;

  const checklist = z.array(z.string().trim().min(1)).parse(JSON.parse(parsed.checklist || "[]"));

  return {
    title: parsed.title,
    amountCents: brlToCents(parsed.amount),
    frequency: parsed.frequency,
    weekDays,
    checklist,
  };
}

export async function createTaskTemplate(projectId: string, formData: FormData) {
  await requireUser();
  const parsed = parseTemplateForm(formData);

  const [maxOrderRow] = await db
    .select({ max: sql<number>`coalesce(max(${taskTemplates.order}), -1)` })
    .from(taskTemplates)
    .where(eq(taskTemplates.projectId, projectId));
  const nextOrder = (maxOrderRow?.max ?? -1) + 1;

  const [template] = await db
    .insert(taskTemplates)
    .values({
      projectId,
      title: parsed.title,
      amountCents: parsed.amountCents,
      frequency: parsed.frequency,
      weekDays: parsed.weekDays,
      order: nextOrder,
    })
    .returning();

  if (parsed.checklist.length > 0) {
    await db.insert(taskChecklistTemplates).values(
      parsed.checklist.map((label, index) => ({
        taskTemplateId: template.id,
        label,
        order: index,
      })),
    );
  }

  revalidatePath(`/projects/${projectId}/settings`);
  revalidatePath(`/projects/${projectId}`);
}

export async function updateTaskTemplate(
  templateId: string,
  projectId: string,
  formData: FormData,
) {
  await requireUser();
  const parsed = parseTemplateForm(formData);

  await db
    .update(taskTemplates)
    .set({
      title: parsed.title,
      amountCents: parsed.amountCents,
      frequency: parsed.frequency,
      weekDays: parsed.weekDays,
      updatedAt: new Date(),
    })
    .where(eq(taskTemplates.id, templateId));

  // Checklist do template é substituído por completo. Ocorrências já criadas
  // mantêm sua própria cópia independente (regra #5) — nada aqui as afeta.
  await db
    .delete(taskChecklistTemplates)
    .where(eq(taskChecklistTemplates.taskTemplateId, templateId));

  if (parsed.checklist.length > 0) {
    await db.insert(taskChecklistTemplates).values(
      parsed.checklist.map((label, index) => ({
        taskTemplateId: templateId,
        label,
        order: index,
      })),
    );
  }

  revalidatePath(`/projects/${projectId}/settings`);
  revalidatePath(`/projects/${projectId}`);
}

export async function setTemplateActive(templateId: string, projectId: string, isActive: boolean) {
  await requireUser();
  await db.update(taskTemplates).set({ isActive }).where(eq(taskTemplates.id, templateId));
  revalidatePath(`/projects/${projectId}/settings`);
  revalidatePath(`/projects/${projectId}`);
}

export async function moveTemplate(
  templateId: string,
  projectId: string,
  direction: "up" | "down",
) {
  await requireUser();
  const list = await db.query.taskTemplates.findMany({
    where: eq(taskTemplates.projectId, projectId),
    orderBy: (t, { asc }) => [asc(t.order)],
  });

  const index = list.findIndex((t) => t.id === templateId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapIndex < 0 || swapIndex >= list.length) return;

  const current = list[index];
  const swapWith = list[swapIndex];

  await db.transaction(async (tx) => {
    await tx.update(taskTemplates).set({ order: swapWith.order }).where(eq(taskTemplates.id, current.id));
    await tx.update(taskTemplates).set({ order: current.order }).where(eq(taskTemplates.id, swapWith.id));
  });

  revalidatePath(`/projects/${projectId}/settings`);
  revalidatePath(`/projects/${projectId}`);
}
