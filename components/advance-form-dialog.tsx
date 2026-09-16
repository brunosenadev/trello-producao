"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createAdvanceAction } from "@/lib/actions/finance";

type Installment = { referenceMonth: string; amount: string };

const MONTH_FORMATTER = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

function formatMonth(value: string): string {
  const [year, month] = value.split("-").map(Number);
  return MONTH_FORMATTER.format(new Date(year, month - 1, 1));
}

function nextMonths(count: number): string[] {
  const today = new Date();
  const months: string[] = [];
  for (let i = 1; i <= count; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`);
  }
  return months;
}

export function AdvanceFormDialog({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [totalAmount, setTotalAmount] = useState("");
  const [installments, setInstallments] = useState<Installment[]>([]);

  function addInstallment() {
    const used = installments.map((i) => i.referenceMonth);
    const candidate = nextMonths(24).find((month) => !used.includes(month));
    if (!candidate) return;
    setInstallments((prev) => [...prev, { referenceMonth: candidate, amount: "" }]);
  }

  function updateInstallment(index: number, amount: string) {
    setInstallments((prev) => prev.map((inst, i) => (i === index ? { ...inst, amount } : inst)));
  }

  function removeInstallment(index: number) {
    setInstallments((prev) => prev.filter((_, i) => i !== index));
  }

  async function action(formData: FormData) {
    await createAdvanceAction(formData);
    setOpen(false);
    setTotalAmount("");
    setInstallments([]);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Novo adiantamento
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo adiantamento</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="userId" value={userId} />
          <div className="space-y-2">
            <Label htmlFor="totalAmount">Valor total (R$)</Label>
            <Input
              id="totalAmount"
              name="totalAmount"
              required
              value={totalAmount}
              onChange={(event) => setTotalAmount(event.target.value)}
              inputMode="decimal"
              placeholder="1500,00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Observação</Label>
            <Textarea id="description" name="description" placeholder="Opcional" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Planejamento de parcelas (opcional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addInstallment}>
                <Plus className="size-4" />
                Adicionar mês
              </Button>
            </div>
            {installments.map((installment, index) => (
              <div key={installment.referenceMonth} className="flex items-center gap-2">
                <span className="w-32 shrink-0 text-sm capitalize text-muted-foreground">
                  {formatMonth(installment.referenceMonth)}
                </span>
                <Input
                  value={installment.amount}
                  onChange={(event) => updateInstallment(index, event.target.value)}
                  placeholder="500,00"
                  inputMode="decimal"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeInstallment(index)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <input
            type="hidden"
            name="installments"
            value={JSON.stringify(installments.filter((i) => i.amount.trim()))}
          />

          <DialogFooter>
            <Button type="submit">Criar adiantamento</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
