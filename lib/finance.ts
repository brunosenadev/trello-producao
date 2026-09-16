import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  advanceInstallments,
  advances,
  financialTransactions,
  taskOccurrenceChecklistItems,
  taskOccurrences,
} from "@/lib/db/schema";

export class TaskAlreadyCompletedError extends Error {}

/**
 * Convenção de sinal do ledger (regras #12-#14 do escopo): o "saldo" é o
 * saldo de adiantamento. ADVANCE_CREDIT soma (dinheiro entregue
 * antecipadamente), TASK_EARNING subtrai (o trabalho "consome" o
 * adiantamento). Um saldo negativo significa que o funcionário já gerou
 * mais valor do que recebeu de adiantamento — ou seja, há um valor a pagar.
 */

/**
 * Marca a ocorrência como concluída e gera a movimentação financeira
 * correspondente dentro de uma única transação com row lock — impede que
 * duas conclusões simultâneas da mesma ocorrência gerem dois pagamentos
 * (regras #2, #10, #20). O unique index parcial em
 * financial_transactions(taskOccurrenceId) WHERE type='TASK_EARNING' é a
 * segunda linha de defesa caso o lock falhe por qualquer motivo.
 */
export async function completeTaskOccurrence(occurrenceId: string, completedByUserId: string) {
  return db.transaction(async (tx) => {
    const [occurrence] = await tx
      .select()
      .from(taskOccurrences)
      .where(eq(taskOccurrences.id, occurrenceId))
      .for("update");

    if (!occurrence) {
      throw new Error("Ocorrência não encontrada.");
    }
    if (occurrence.status === "CONCLUIDA") {
      throw new TaskAlreadyCompletedError("Esta tarefa já foi concluída.");
    }

    const completedAt = new Date();

    await tx
      .update(taskOccurrences)
      .set({
        status: "CONCLUIDA",
        completedAt,
        completedByUserId,
      })
      .where(eq(taskOccurrences.id, occurrenceId));

    const beneficiaryId = occurrence.assignedUserId ?? completedByUserId;

    await tx.insert(financialTransactions).values({
      userId: beneficiaryId,
      type: "TASK_EARNING",
      amountCents: -occurrence.amountCents,
      description: "Tarefa concluída",
      taskOccurrenceId: occurrence.id,
      createdByUserId: completedByUserId,
    });

    return { ...occurrence, status: "CONCLUIDA" as const, completedAt, completedByUserId };
  });
}

/** Reabre uma ocorrência concluída por engano, estornando o lançamento. */
export async function reopenTaskOccurrence(occurrenceId: string) {
  return db.transaction(async (tx) => {
    const [occurrence] = await tx
      .select()
      .from(taskOccurrences)
      .where(eq(taskOccurrences.id, occurrenceId))
      .for("update");

    if (!occurrence) throw new Error("Ocorrência não encontrada.");
    if (occurrence.status !== "CONCLUIDA") return occurrence;

    await tx
      .update(taskOccurrences)
      .set({ status: "PENDENTE", completedAt: null, completedByUserId: null })
      .where(eq(taskOccurrences.id, occurrenceId));

    await tx
      .delete(financialTransactions)
      .where(
        and(
          eq(financialTransactions.taskOccurrenceId, occurrenceId),
          eq(financialTransactions.type, "TASK_EARNING"),
        ),
      );

    return occurrence;
  });
}

export async function toggleChecklistItem(itemId: string, isDone: boolean) {
  await db
    .update(taskOccurrenceChecklistItems)
    .set({ isDone, doneAt: isDone ? new Date() : null })
    .where(eq(taskOccurrenceChecklistItems.id, itemId));
}

/** Saldo do funcionário — sempre calculado a partir do ledger, nunca armazenado. */
export async function getUserBalanceCents(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${financialTransactions.amountCents}), 0)` })
    .from(financialTransactions)
    .where(eq(financialTransactions.userId, userId));

  return Number(row?.total ?? 0);
}

export async function getUserLedger(userId: string, limit = 100) {
  return db.query.financialTransactions.findMany({
    where: eq(financialTransactions.userId, userId),
    orderBy: [desc(financialTransactions.createdAt)],
    limit,
    with: {
      taskOccurrence: { with: { taskTemplate: true } },
      advance: true,
    },
  });
}

export async function createAdvance(input: {
  userId: string;
  totalAmountCents: number;
  description?: string;
  createdByUserId: string;
  installments?: { referenceMonth: string; amountCents: number; dueDate?: string; note?: string }[];
}) {
  return db.transaction(async (tx) => {
    const [advance] = await tx
      .insert(advances)
      .values({
        userId: input.userId,
        totalAmountCents: input.totalAmountCents,
        description: input.description,
        createdByUserId: input.createdByUserId,
      })
      .returning();

    await tx.insert(financialTransactions).values({
      userId: input.userId,
      type: "ADVANCE_CREDIT",
      amountCents: input.totalAmountCents,
      description: input.description ? `Adiantamento: ${input.description}` : "Adiantamento",
      advanceId: advance.id,
      createdByUserId: input.createdByUserId,
    });

    if (input.installments && input.installments.length > 0) {
      await tx.insert(advanceInstallments).values(
        input.installments.map((installment) => ({
          advanceId: advance.id,
          referenceMonth: installment.referenceMonth,
          amountCents: installment.amountCents,
          dueDate: installment.dueDate,
          note: installment.note,
        })),
      );
    }

    return advance;
  });
}

export async function setInstallmentStatus(
  installmentId: string,
  status: "PLANEJADA" | "APLICADA" | "CANCELADA",
) {
  await db
    .update(advanceInstallments)
    .set({
      status,
      paidDate: status === "APLICADA" ? new Date().toISOString().slice(0, 10) : null,
    })
    .where(eq(advanceInstallments.id, installmentId));
}

export async function getAdvancesForUser(userId: string) {
  return db.query.advances.findMany({
    where: eq(advances.userId, userId),
    orderBy: [desc(advances.createdAt)],
    with: {
      installments: { orderBy: (i, { asc }) => [asc(i.referenceMonth)] },
    },
  });
}
