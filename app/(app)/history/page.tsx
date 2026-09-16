import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { centsToBRL } from "@/lib/money";
import { occurrenceDisplayTitle } from "@/lib/occurrences";
import { getOccurrenceHistory, type HistoryFilters } from "@/lib/queries/history";
import { listProjects } from "@/lib/queries/projects";
import { listUsers } from "@/lib/queries/users";
import { requireUser } from "@/lib/session";
import { formatDateShort, formatDateTimeShort } from "@/lib/timezone";

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  BLOQUEADA: "Bloqueada",
};

function valueOrUndefined(value: string | undefined) {
  return value && value !== "all" ? value : undefined;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireUser();
  const sp = await searchParams;

  const [projects, users] = await Promise.all([listProjects(), listUsers()]);

  const filters: HistoryFilters = {
    projectId: valueOrUndefined(sp.projectId),
    assignedUserId: valueOrUndefined(sp.assignedUserId),
    startDate: sp.startDate || undefined,
    endDate: sp.endDate || undefined,
    status: valueOrUndefined(sp.status) as HistoryFilters["status"],
  };

  const occurrences = await getOccurrenceHistory(filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Histórico</h1>
        <p className="text-sm text-muted-foreground">
          Consulte todas as ocorrências de tarefas já geradas.
        </p>
      </div>

      <form className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5" method="get">
        <div className="space-y-1.5">
          <Label htmlFor="projectId">Projeto</Label>
          <Select name="projectId" defaultValue={sp.projectId ?? "all"}>
            <SelectTrigger id="projectId" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="assignedUserId">Responsável</Label>
          <Select name="assignedUserId" defaultValue={sp.assignedUserId ?? "all"}>
            <SelectTrigger id="assignedUserId" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={sp.status ?? "all"}>
            <SelectTrigger id="status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startDate">De</Label>
          <Input id="startDate" name="startDate" type="date" defaultValue={sp.startDate ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">Até</Label>
          <Input id="endDate" name="endDate" type="date" defaultValue={sp.endDate ?? ""} />
        </div>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
          <Button type="submit">Filtrar</Button>
          <Button type="button" variant="ghost" nativeButton={false} render={<Link href="/history" />}>
            Limpar filtros
          </Button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>Tarefa</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Conclusão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {occurrences.map((occurrence) => (
              <TableRow key={occurrence.id}>
                <TableCell className="whitespace-nowrap">
                  {formatDateShort(occurrence.occurrenceDate)}
                </TableCell>
                <TableCell>{occurrence.project.name}</TableCell>
                <TableCell>{occurrenceDisplayTitle(occurrence)}</TableCell>
                <TableCell>{occurrence.assignedUser?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{STATUS_LABEL[occurrence.status]}</Badge>
                </TableCell>
                <TableCell className="text-right">{centsToBRL(occurrence.amountCents)}</TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {occurrence.completedAt ? formatDateTimeShort(occurrence.completedAt) : "—"}
                </TableCell>
              </TableRow>
            ))}
            {occurrences.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
