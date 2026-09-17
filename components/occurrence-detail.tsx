"use client";

import { CheckCircle2, RotateCcw, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { Occurrence } from "@/components/occurrence-card";
import { ThumbnailField } from "@/components/thumbnail-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  completeOccurrenceAction,
  reopenOccurrenceAction,
  toggleChecklistItemAction,
  updateOccurrenceInfoAction,
} from "@/lib/actions/occurrences";
import { centsToBRL } from "@/lib/money";
import { formatDateTimeShort } from "@/lib/timezone";

export function OccurrenceDetail({
  occurrence,
  onCompleted,
}: {
  occurrence: Occurrence;
  onCompleted?: () => void;
}) {
  const [items, setItems] = useState(occurrence.checklistItems);
  const [isPending, startTransition] = useTransition();
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const isCompleted = occurrence.status === "CONCLUIDA";

  function handleToggle(itemId: string, isDone: boolean) {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, isDone } : item)));
    startTransition(async () => {
      await toggleChecklistItemAction(itemId, isDone, occurrence.projectId);
    });
  }

  function handleComplete() {
    startTransition(async () => {
      const result = await completeOccurrenceAction(occurrence.id, occurrence.projectId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Tarefa concluída! Valor lançado no financeiro.");
      onCompleted?.();
    });
  }

  function handleReopen() {
    startTransition(async () => {
      await reopenOccurrenceAction(occurrence.id, occurrence.projectId);
      toast.success("Tarefa reaberta.");
    });
  }

  async function handleSaveInfo(formData: FormData) {
    setIsSavingInfo(true);
    try {
      await updateOccurrenceInfoAction(occurrence.id, occurrence.projectId, formData);
      toast.success("Informações do vídeo salvas.");
    } finally {
      setIsSavingInfo(false);
    }
  }

  return (
    <div className="space-y-6 px-4 py-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="outline">{centsToBRL(occurrence.amountCents)}</Badge>
        {occurrence.assignedUser && <span>Responsável: {occurrence.assignedUser.name}</span>}
      </div>

      <form action={handleSaveInfo} className="space-y-3 rounded-lg border p-3">
        <h3 className="text-sm font-medium">Informações deste vídeo</h3>
        <div className="space-y-1.5">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            name="title"
            defaultValue={occurrence.title ?? ""}
            placeholder="Título do vídeo"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="instructions">Instruções</Label>
          <Textarea
            id="instructions"
            name="instructions"
            defaultValue={occurrence.instructions ?? ""}
            rows={3}
            placeholder="O que precisa ser feito neste vídeo específico"
          />
        </div>
        <ThumbnailField
          defaultVideoUrl={occurrence.videoUrl}
          defaultThumbnailUrl={occurrence.thumbnailUrl}
        />
        <Button type="submit" size="sm" variant="outline" disabled={isSavingInfo}>
          <Save className="size-4" />
          Salvar informações
        </Button>
      </form>

      {items.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Checklist</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-2 rounded-lg border p-2 text-sm has-[[data-disabled]]:opacity-60"
              >
                <Checkbox
                  checked={item.isDone}
                  disabled={isCompleted}
                  onCheckedChange={(checked) => handleToggle(item.id, checked === true)}
                />
                <span className={item.isDone ? "text-muted-foreground line-through" : ""}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {isCompleted ? (
        <div className="space-y-3 rounded-lg border bg-primary/5 p-3 text-sm">
          <p className="flex items-center gap-2 font-medium text-primary">
            <CheckCircle2 className="size-4" />
            Concluída
          </p>
          {occurrence.completedAt && (
            <p className="text-muted-foreground">em {formatDateTimeShort(occurrence.completedAt)}</p>
          )}
          {occurrence.completedByUser && (
            <p className="text-muted-foreground">por {occurrence.completedByUser.name}</p>
          )}
          <Button variant="outline" size="sm" onClick={handleReopen} disabled={isPending}>
            <RotateCcw className="size-4" />
            Reabrir tarefa
          </Button>
        </div>
      ) : (
        <Button className="w-full" onClick={handleComplete} disabled={isPending}>
          <CheckCircle2 className="size-4" />
          Concluir tarefa
        </Button>
      )}
    </div>
  );
}
