"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";

import type { Occurrence } from "@/components/occurrence-card";
import { OccurrenceDetail } from "@/components/occurrence-detail";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { occurrenceDisplayTitle } from "@/lib/occurrences";
import { formatDateShort } from "@/lib/timezone";
import { cn } from "@/lib/utils";

export function BoardOccurrenceCard({
  occurrence,
  isToday,
}: {
  occurrence: Occurrence;
  isToday: boolean;
}) {
  const [open, setOpen] = useState(false);
  const total = occurrence.checklistItems.length;
  const done = occurrence.checklistItems.filter((item) => item.isDone).length;
  const isCompleted = occurrence.status === "CONCLUIDA";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full rounded-lg border bg-card p-2.5 text-left text-sm shadow-sm transition-shadow hover:shadow-md",
          isToday && "border-primary/50 ring-1 ring-primary/30",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-medium">
            {isCompleted ? (
              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
            ) : (
              <Circle className="size-3.5 shrink-0 text-muted-foreground" />
            )}
            {formatDateShort(occurrence.occurrenceDate)}
            {isToday && <span className="text-[10px] font-normal text-primary">hoje</span>}
          </span>
          {total > 0 && (
            <Badge
              variant={done === total ? "default" : "outline"}
              className="px-1.5 py-0 text-[10px]"
            >
              {done}/{total}
            </Badge>
          )}
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {occurrenceDisplayTitle(occurrence)}
        </p>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {occurrenceDisplayTitle(occurrence)} · {formatDateShort(occurrence.occurrenceDate)}
            </SheetTitle>
          </SheetHeader>
          <OccurrenceDetail occurrence={occurrence} />
        </SheetContent>
      </Sheet>
    </>
  );
}
