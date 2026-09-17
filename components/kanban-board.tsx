import { Settings } from "lucide-react";
import Link from "next/link";

import { BoardOccurrenceCard } from "@/components/board-occurrence-card";
import type { getBoardData } from "@/lib/queries/board";
import type { DateOnly } from "@/lib/timezone";

type BoardColumns = Awaited<ReturnType<typeof getBoardData>>;

export function KanbanBoard({ columns, today }: { columns: BoardColumns; today: DateOnly }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {columns.map(({ project, occurrences }) => {
        const pending = occurrences.filter((o) => o.status !== "CONCLUIDA");
        const completed = occurrences.filter((o) => o.status === "CONCLUIDA");

        return (
          <div
            key={project.id}
            className="flex w-96 shrink-0 flex-col gap-3 rounded-2xl bg-muted/40 p-4"
          >
            <div className="flex items-center justify-between gap-2 px-1">
              <Link
                href={`/projects/${project.id}`}
                className="truncate text-base font-semibold hover:underline"
              >
                {project.name}
              </Link>
              <Link
                href={`/projects/${project.id}/settings`}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <Settings className="size-4" />
              </Link>
            </div>

            {project.description && (
              <div className="rounded-lg border border-dashed bg-card/60 p-2 text-xs text-muted-foreground">
                {project.description}
              </div>
            )}

            <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1">
              {occurrences.length === 0 ? (
                <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                  Nenhuma tarefa recorrente configurada
                </p>
              ) : (
                <>
                  <div className="flex flex-col gap-3">
                    <p className="px-1 text-xs font-medium text-muted-foreground">
                      Pendentes ({pending.length})
                    </p>
                    {pending.length === 0 ? (
                      <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                        Nenhuma pendente
                      </p>
                    ) : (
                      pending.map((occurrence) => (
                        <BoardOccurrenceCard
                          key={occurrence.id}
                          occurrence={occurrence}
                          isToday={occurrence.occurrenceDate === today}
                        />
                      ))
                    )}
                  </div>

                  {completed.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <p className="px-1 text-xs font-medium text-muted-foreground">
                        Concluídas ({completed.length})
                      </p>
                      {completed.map((occurrence) => (
                        <BoardOccurrenceCard
                          key={occurrence.id}
                          occurrence={occurrence}
                          isToday={occurrence.occurrenceDate === today}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
