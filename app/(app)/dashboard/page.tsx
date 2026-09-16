import { KanbanBoard } from "@/components/kanban-board";
import { ProjectFormDialog } from "@/components/project-form-dialog";
import { StatCard } from "@/components/stat-card";
import { getUserBalanceCents } from "@/lib/finance";
import { centsToBRL } from "@/lib/money";
import { getMonthGeneratedCents, getUpcomingInstallments } from "@/lib/queries/dashboard";
import { getBoardData } from "@/lib/queries/board";
import { listUsers } from "@/lib/queries/users";
import { requireUser } from "@/lib/session";
import { addDaysToDate, formatDateLong, formatMonthLabel, todayInBrazil } from "@/lib/timezone";

export default async function DashboardPage() {
  const user = await requireUser();
  const today = todayInBrazil();
  const windowStart = addDaysToDate(today, -3);
  const windowEnd = addDaysToDate(today, 14);

  const [columns, users, monthGeneratedCents, balanceCents, upcomingInstallments] = await Promise.all([
    getBoardData(windowStart, windowEnd),
    listUsers(),
    getMonthGeneratedCents(user.id),
    getUserBalanceCents(user.id),
    getUpcomingInstallments(),
  ]);

  const todayOccurrences = columns
    .flatMap((column) => column.occurrences)
    .filter((occurrence) => occurrence.occurrenceDate === today);

  const totalToday = todayOccurrences.length;
  const completedToday = todayOccurrences.filter((o) => o.status === "CONCLUIDA").length;
  const pendingToday = totalToday - completedToday;
  const progressPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
  const generatedTodayCents = todayOccurrences
    .filter((o) => o.status === "CONCLUIDA")
    .reduce((sum, o) => sum + o.amountCents, 0);

  const nextInstallment = upcomingInstallments[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Olá, {(user.name ?? "").split(" ")[0] || "tudo bem"}
        </h1>
        <p className="text-sm text-muted-foreground capitalize">{formatDateLong(today)}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Projetos ativos" value={String(columns.length)} />
        <StatCard
          label="Tarefas de hoje"
          value={String(totalToday)}
          hint={`${completedToday} concluídas · ${pendingToday} pendentes`}
        />
        <StatCard label="Progresso do dia" value={`${progressPercent}%`} />
        <StatCard label="Gerado hoje" value={centsToBRL(generatedTodayCents)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Gerado no mês" value={centsToBRL(monthGeneratedCents)} />
        <StatCard
          label={balanceCents >= 0 ? "Seu saldo de adiantamento" : "Valor a receber"}
          value={centsToBRL(Math.abs(balanceCents))}
        />
        <StatCard
          label="Próximo compromisso"
          value={nextInstallment ? centsToBRL(nextInstallment.amountCents) : "Nenhum"}
          hint={nextInstallment ? formatMonthLabel(nextInstallment.referenceMonth) : undefined}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Quadro</h2>
          <ProjectFormDialog users={users} />
        </div>
        <KanbanBoard columns={columns} today={today} />
      </div>
    </div>
  );
}
