"use client";

import { useTransition } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setInstallmentStatusAction } from "@/lib/actions/finance";
import type { getAdvancesForUser } from "@/lib/finance";
import { centsToBRL } from "@/lib/money";
import { formatMonthLabel } from "@/lib/timezone";

type Advance = Awaited<ReturnType<typeof getAdvancesForUser>>[number];

export function InstallmentsList({ advances }: { advances: Advance[] }) {
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      {advances
        .filter((advance) => advance.installments.length > 0)
        .map((advance) => (
          <Card key={advance.id}>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Adiantamento de {centsToBRL(advance.totalAmountCents)}
                {advance.description ? ` — ${advance.description}` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {advance.installments.map((installment) => (
                <div
                  key={installment.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-2 text-sm"
                >
                  <span className="capitalize">{formatMonthLabel(installment.referenceMonth)}</span>
                  <span className="font-medium">{centsToBRL(installment.amountCents)}</span>
                  <Select
                    value={installment.status}
                    onValueChange={(value) =>
                      startTransition(() =>
                        setInstallmentStatusAction(
                          installment.id,
                          value as "PLANEJADA" | "APLICADA" | "CANCELADA",
                        ),
                      )
                    }
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANEJADA">Planejada</SelectItem>
                      <SelectItem value="APLICADA">Aplicada</SelectItem>
                      <SelectItem value="CANCELADA">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
