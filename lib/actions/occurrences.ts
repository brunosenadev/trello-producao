"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { taskOccurrences } from "@/lib/db/schema";
import {
  completeTaskOccurrence,
  reopenTaskOccurrence,
  TaskAlreadyCompletedError,
  toggleChecklistItem,
} from "@/lib/finance";
import { requireUser } from "@/lib/session";

function revalidateAfterFinancialChange(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  revalidatePath("/financial");
  revalidatePath("/history");
  revalidatePath("/calendar");
}

const occurrenceInfoSchema = z.object({
  title: z.string().trim().max(300).optional(),
  instructions: z.string().trim().max(5000).optional(),
  videoUrl: z.string().trim().max(2000).optional(),
  thumbnailUrl: z.string().trim().max(2000).optional(),
});

export async function updateOccurrenceInfoAction(
  occurrenceId: string,
  projectId: string,
  formData: FormData,
) {
  await requireUser();

  const parsed = occurrenceInfoSchema.parse({
    title: (formData.get("title") as string) || undefined,
    instructions: (formData.get("instructions") as string) || undefined,
    videoUrl: (formData.get("videoUrl") as string) || undefined,
    thumbnailUrl: (formData.get("thumbnailUrl") as string) || undefined,
  });

  await db
    .update(taskOccurrences)
    .set({
      title: parsed.title || null,
      instructions: parsed.instructions || null,
      videoUrl: parsed.videoUrl || null,
      thumbnailUrl: parsed.thumbnailUrl || null,
    })
    .where(eq(taskOccurrences.id, occurrenceId));

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
}

export async function completeOccurrenceAction(occurrenceId: string, projectId: string) {
  const user = await requireUser();

  try {
    await completeTaskOccurrence(occurrenceId, user.id);
  } catch (error) {
    if (error instanceof TaskAlreadyCompletedError) {
      return { success: false as const, error: error.message };
    }
    throw error;
  }

  revalidateAfterFinancialChange(projectId);
  return { success: true as const };
}

export async function reopenOccurrenceAction(occurrenceId: string, projectId: string) {
  await requireUser();
  await reopenTaskOccurrence(occurrenceId);
  revalidateAfterFinancialChange(projectId);
}

export async function toggleChecklistItemAction(
  itemId: string,
  isDone: boolean,
  projectId: string,
) {
  await requireUser();
  await toggleChecklistItem(itemId, isDone);
  revalidatePath(`/projects/${projectId}`);
}
