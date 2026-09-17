"use client";

import { useState } from "react";

import { OccurrenceDetail } from "@/components/occurrence-detail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { centsToBRL } from "@/lib/money";
import { occurrenceDisplayTitle } from "@/lib/occurrence-display";
import type { getOccurrencesForDate } from "@/lib/occurrences";

export type Occurrence = Awaited<ReturnType<typeof getOccurrencesForDate>>[number];

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  BLOQUEADA: "Bloqueada",
};

const STATUS_VARIANT: Record<string, "secondary" | "default" | "outline" | "destructive"> = {
  PENDENTE: "outline",
  EM_ANDAMENTO: "secondary",
  CONCLUIDA: "default",
  BLOQUEADA: "destructive",
};

export function OccurrenceCard({ occurrence }: { occurrence: Occurrence }) {
  const [open, setOpen] = useState(false);
  const total = occurrence.checklistItems.length;
  const done = occurrence.checklistItems.filter((item) => item.isDone).length;
  const progress =
    total > 0 ? Math.round((done / total) * 100) : occurrence.status === "CONCLUIDA" ? 100 : 0;

  return (
    <>
      <Card className="flex h-full flex-col gap-3 rounded-2xl transition-shadow hover:shadow-md">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{occurrenceDisplayTitle(occurrence)}</CardTitle>
            {occurrence.title && (
              <p className="text-xs text-muted-foreground">{occurrence.taskTemplate.title}</p>
            )}
          </div>
          <Badge variant={STATUS_VARIANT[occurrence.status]}>{STATUS_LABEL[occurrence.status]}</Badge>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3">
          {total > 0 ? (
            <div className="space-y-1">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">
                {done}/{total} passos concluídos
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Sem checklist</p>
          )}
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="text-sm font-medium">{centsToBRL(occurrence.amountCents)}</span>
            <Button size="sm" onClick={() => setOpen(true)}>
              Abrir tarefa
            </Button>
          </div>
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{occurrenceDisplayTitle(occurrence)}</SheetTitle>
          </SheetHeader>
          <OccurrenceDetail occurrence={occurrence} onCompleted={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
