"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTaskTemplate, updateTaskTemplate } from "@/lib/actions/templates";

const WEEKDAYS = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

type Frequency = "DIARIA" | "DIAS_SEMANA" | "DESATIVADA";

type TemplateFormValue = {
  id: string;
  title: string;
  amountCents: number;
  frequency: Frequency;
  weekDays: number[] | null;
  checklistTemplates: { label: string }[];
};

export function TaskTemplateFormDialog({
  projectId,
  template,
  trigger,
}: {
  projectId: string;
  template?: TemplateFormValue;
  trigger?: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!template;

  const [amount, setAmount] = useState(
    template ? (template.amountCents / 100).toFixed(2).replace(".", ",") : "50,00",
  );
  const [frequency, setFrequency] = useState<Frequency>(template?.frequency ?? "DIARIA");
  const [weekDays, setWeekDays] = useState<number[]>(template?.weekDays ?? []);
  const [checklist, setChecklist] = useState<string[]>(
    template?.checklistTemplates.map((c) => c.label) ?? [],
  );
  const [newStep, setNewStep] = useState("");

  function addStep() {
    if (!newStep.trim()) return;
    setChecklist((prev) => [...prev, newStep.trim()]);
    setNewStep("");
  }

  function removeStep(index: number) {
    setChecklist((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleWeekday(day: number) {
    setWeekDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    );
  }

  async function action(formData: FormData) {
    if (isEdit) {
      await updateTaskTemplate(template.id, projectId, formData);
    } else {
      await createTaskTemplate(projectId, formData);
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button>
              <Plus className="size-4" />
              Nova tarefa recorrente
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar tarefa recorrente" : "Nova tarefa recorrente"}</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Nome da demanda</Label>
            <Input id="title" name="title" required defaultValue={template?.title} placeholder="Ex: Vídeo" />
            <p className="text-xs text-muted-foreground">
              O tipo de demanda recorrente (ex: &quot;Vídeo&quot;). O título, instruções e
              thumbnail de cada vídeo específico são preenchidos dentro de cada ocorrência do
              dia.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor por conclusão (R$)</Label>
              <Input
                id="amount"
                name="amount"
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                inputMode="decimal"
                placeholder="50,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Recorrência</Label>
              <Select
                name="frequency"
                value={frequency}
                onValueChange={(value) => setFrequency(value as Frequency)}
              >
                <SelectTrigger id="frequency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIARIA">Diária</SelectItem>
                  <SelectItem value="DIAS_SEMANA">Dias específicos da semana</SelectItem>
                  <SelectItem value="DESATIVADA">Desativada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {frequency === "DIAS_SEMANA" && (
            <div className="space-y-2">
              <Label>Dias da semana</Label>
              <div className="flex flex-wrap gap-3">
                {WEEKDAYS.map((day) => (
                  <label key={day.value} className="flex items-center gap-1.5 text-sm">
                    <Checkbox
                      checked={weekDays.includes(day.value)}
                      onCheckedChange={() => toggleWeekday(day.value)}
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </div>
          )}
          <input type="hidden" name="weekDays" value={JSON.stringify(weekDays)} />

          <div className="space-y-2">
            <Label>Checklist</Label>
            <div className="space-y-2">
              {checklist.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm">{step}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeStep(index)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              {checklist.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum passo adicionado ainda.</p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newStep}
                onChange={(event) => setNewStep(event.target.value)}
                placeholder="Adicionar passo"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addStep();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addStep}>
                <Plus className="size-4" />
                Adicionar
              </Button>
            </div>
          </div>
          <input type="hidden" name="checklist" value={JSON.stringify(checklist)} />

          {isEdit && (
            <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
              Esta alteração será aplicada às próximas ocorrências. Ocorrências já criadas/concluídas
              não serão alteradas.
            </p>
          )}

          <DialogFooter>
            <Button type="submit">{isEdit ? "Salvar alterações" : "Criar tarefa"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
