import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { CalendarMonthGrid } from "@/components/calendar-month-grid";
import { OccurrenceCard } from "@/components/occurrence-card";
import { Button } from "@/components/ui/button";
import { getOccurrencesForDateAcrossProjects } from "@/lib/queries/dashboard";
import { getCalendarMonthSummary } from "@/lib/queries/calendar";
import { requireUser } from "@/lib/session";
import { formatDateLong, formatMonthLabel, monthRange, shiftMonthKey, todayInBrazil } from "@/lib/timezone";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; date?: string }>;
}) {
  await requireUser();
  const { month: monthParam, date: dateParam } = await searchParams;
  const today = todayInBrazil();
  const monthKey = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : today.slice(0, 7);
  const { start, end } = monthRange(monthKey);
  const selectedDate = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : undefined;

  const days = await getCalendarMonthSummary(start, end, today);
  const selectedOccurrences = selectedDate
    ? await getOccurrencesForDateAcrossProjects(selectedDate)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Calendário</h1>
        <p className="text-sm text-muted-foreground">
          Visualize as tarefas previstas e concluídas por dia.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              nativeButton={false}
              render={<Link href={`/calendar?month=${shiftMonthKey(monthKey, -1)}`} />}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <h2 className="text-sm font-medium capitalize">{formatMonthLabel(`${monthKey}-01`)}</h2>
            <Button
              variant="ghost"
              size="icon"
              nativeButton={false}
              render={<Link href={`/calendar?month=${shiftMonthKey(monthKey, 1)}`} />}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <CalendarMonthGrid monthKey={monthKey} days={days} selectedDate={selectedDate ?? ""} />
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium">
            {selectedDate ? (
              <span className="capitalize">{formatDateLong(selectedDate)}</span>
            ) : (
              "Selecione um dia"
            )}
          </h2>
          {selectedDate ? (
            selectedOccurrences.length === 0 ? (
              <p className="rounded-2xl border border-dashed py-10 text-center text-sm text-muted-foreground">
                Nenhuma tarefa prevista.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedOccurrences.map((occurrence) => (
                  <div key={occurrence.id} className="space-y-1">
                    <p className="px-1 text-xs font-medium text-muted-foreground">
                      {occurrence.projectName}
                    </p>
                    <OccurrenceCard occurrence={occurrence} />
                  </div>
                ))}
              </div>
            )
          ) : (
            <p className="rounded-2xl border border-dashed py-10 text-center text-sm text-muted-foreground">
              Clique em um dia no calendário para ver as tarefas.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
