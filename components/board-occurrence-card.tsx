"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";

import type { Occurrence } from "@/components/occurrence-card";
import { OccurrenceDetail } from "@/components/occurrence-detail";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { occurrenceDisplayTitle } from "@/lib/occurrence-display";
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
          "w-full cursor-pointer rounded-xl border bg-card p-5 text-left text-base shadow-sm transition-shadow hover:shadow-md",
          open && "border-primary/50 ring-1 ring-primary/30",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-medium">
            {isCompleted ? (
              <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
            ) : (
              <Circle className="size-5 shrink-0 text-muted-foreground" />
            )}
            {formatDateShort(occurrence.occurrenceDate)}
            {isToday && <span className="text-xs font-normal text-primary">hoje</span>}
          </span>
          {total > 0 && (
            <Badge variant={done === total ? "default" : "outline"} className="px-2 py-0.5 text-xs">
              {done}/{total}
            </Badge>
          )}
        </div>
        <p className="mt-2 truncate text-sm text-muted-foreground">
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
          <OccurrenceDetail occurrence={occurrence} onCompleted={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
