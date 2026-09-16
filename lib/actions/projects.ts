"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { requireUser } from "@/lib/session";

const projectSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(200),
  description: z.string().trim().max(2000).optional(),
  assignedUserId: z.string().uuid().optional(),
});

function parseProjectForm(formData: FormData) {
  return projectSchema.parse({
    name: formData.get("name"),
    description: (formData.get("description") as string) || undefined,
    assignedUserId: (formData.get("assignedUserId") as string) || undefined,
  });
}

export async function createProject(formData: FormData) {
  const user = await requireUser();
  const parsed = parseProjectForm(formData);

  const [project] = await db
    .insert(projects)
    .values({
      name: parsed.name,
      description: parsed.description ?? null,
      ownerUserId: user.id,
      assignedUserId: parsed.assignedUserId ?? null,
    })
    .returning();

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect(`/projects/${project.id}`);
}

export async function updateProject(projectId: string, formData: FormData) {
  await requireUser();
  const parsed = parseProjectForm(formData);

  await db
    .update(projects)
    .set({
      name: parsed.name,
      description: parsed.description ?? null,
      assignedUserId: parsed.assignedUserId ?? null,
    })
    .where(eq(projects.id, projectId));

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}

export async function toggleProjectActive(projectId: string, isActive: boolean) {
  await requireUser();
  await db.update(projects).set({ isActive }).where(eq(projects.id, projectId));
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}
