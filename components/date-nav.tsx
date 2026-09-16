"use client";

import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addDaysToDate, formatDateLong, todayInBrazil, type DateOnly } from "@/lib/timezone";

function parseDateOnlyToLocalDate(value: DateOnly): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function localDateToDateOnly(value: Date): DateOnly {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DateNav({ basePath, date }: { basePath: string; date: DateOnly }) {
  const router = useRouter();
  const isToday = date === todayInBrazil();

  function go(newDate: DateOnly) {
    router.push(`${basePath}?date=${newDate}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card p-2">
      <Button variant="ghost" size="icon" onClick={() => go(addDaysToDate(date, -1))}>
        <ChevronLeft className="size-4" />
      </Button>
      <Button variant={isToday ? "secondary" : "ghost"} size="sm" onClick={() => go(todayInBrazil())}>
        Hoje
      </Button>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              className="flex-1 justify-start gap-2 px-2 text-left font-medium capitalize sm:flex-none"
            />
          }
        >
          <CalendarIcon className="size-4" />
          {formatDateLong(date)}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={parseDateOnlyToLocalDate(date)}
            onSelect={(value) => value && go(localDateToDateOnly(value))}
          />
        </PopoverContent>
      </Popover>
      <Button variant="ghost" size="icon" onClick={() => go(addDaysToDate(date, 1))}>
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
