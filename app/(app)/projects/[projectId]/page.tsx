import { Settings } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DateNav } from "@/components/date-nav";
import { OccurrenceCard } from "@/components/occurrence-card";
import { Button } from "@/components/ui/button";
import { ensureOccurrencesForDate } from "@/lib/occurrences";
import { getProject } from "@/lib/queries/projects";
import { requireUser } from "@/lib/session";
import { todayInBrazil } from "@/lib/timezone";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  await requireUser();
  const { projectId } = await params;
  const { date: dateParam } = await searchParams;
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : todayInBrazil();

  const project = await getProject(projectId);
  if (!project) notFound();

  const occurrences = await ensureOccurrencesForDate(projectId, date);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={`/projects/${projectId}/settings`} />}
        >
          <Settings className="size-4" />
          Configurar tarefas
        </Button>
      </div>

      <DateNav basePath={`/projects/${projectId}`} date={date} />

      {occurrences.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          Nenhuma tarefa prevista para este dia.{" "}
          <Link
            href={`/projects/${projectId}/settings`}
            className="font-medium text-primary underline underline-offset-2"
          >
            Configure as tarefas recorrentes
          </Link>
          .
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {occurrences.map((occurrence) => (
            <OccurrenceCard key={occurrence.id} occurrence={occurrence} />
          ))}
        </div>
      )}
    </div>
  );
}
