import Link from "next/link";

import type { CalendarDaySummary } from "@/lib/queries/calendar";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function CalendarMonthGrid({
  monthKey,
  days,
  selectedDate,
}: {
  monthKey: string;
  days: CalendarDaySummary[];
  selectedDate: string;
}) {
  const [year, month] = monthKey.split("-").map(Number);
  const firstWeekday = new Date(year, month - 1, 1).getDay(); // 0 = domingo
  const leadingBlanks = (firstWeekday + 6) % 7; // transforma para semana começando na segunda

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }).map((_, index) => (
          <div key={`blank-${index}`} />
        ))}
        {days.map((day) => {
          const dayNumber = Number(day.date.slice(-2));
          const isSelected = day.date === selectedDate;

          return (
            <Link
              key={day.date}
              href={`/calendar?month=${monthKey}&date=${day.date}`}
              className={cn(
                "flex min-h-16 flex-col items-start gap-1.5 rounded-lg border p-1.5 text-xs transition-colors hover:bg-accent",
                isSelected && "border-primary bg-primary/5",
                !isSelected && day.hasOverdue && "border-destructive/40",
              )}
            >
              <span className={cn("text-sm font-medium", isSelected && "text-primary")}>
                {dayNumber}
              </span>
              {day.expectedCount > 0 && (
                <div className="flex flex-wrap gap-0.5">
                  {Array.from({ length: Math.min(day.expectedCount, 6) }).map((_, index) => (
                    <span
                      key={index}
                      className={cn(
                        "size-1.5 rounded-full",
                        index < day.completedCount ? "bg-primary" : "bg-muted-foreground/40",
                      )}
                    />
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
