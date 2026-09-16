"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createAdvance, setInstallmentStatus } from "@/lib/finance";
import { brlToCents } from "@/lib/money";
import { requireUser } from "@/lib/session";

const installmentSchema = z.object({
  referenceMonth: z.string().regex(/^\d{4}-\d{2}-01$/),
  amount: z.string().min(1),
});

export async function createAdvanceAction(formData: FormData) {
  const user = await requireUser();

  const userId = z.string().uuid().parse(formData.get("userId"));
  const totalAmountCents = brlToCents(String(formData.get("totalAmount") ?? ""));
  const description = (formData.get("description") as string) || undefined;
  const installmentsRaw = (formData.get("installments") as string) || "[]";
  const installments = z.array(installmentSchema).parse(JSON.parse(installmentsRaw));

  if (totalAmountCents <= 0) {
    throw new Error("Valor do adiantamento deve ser maior que zero.");
  }

  await createAdvance({
    userId,
    totalAmountCents,
    description,
    createdByUserId: user.id,
    installments: installments.map((installment) => ({
      referenceMonth: installment.referenceMonth,
      amountCents: brlToCents(installment.amount),
    })),
  });

  revalidatePath("/financial");
  revalidatePath("/dashboard");
}

export async function setInstallmentStatusAction(
  installmentId: string,
  status: "PLANEJADA" | "APLICADA" | "CANCELADA",
) {
  await requireUser();
  await setInstallmentStatus(installmentId, status);
  revalidatePath("/financial");
}
