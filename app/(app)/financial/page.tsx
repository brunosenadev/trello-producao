import Link from "next/link";

import { AdvanceFormDialog } from "@/components/advance-form-dialog";
import { InstallmentsList } from "@/components/installments-list";
import { LedgerTable } from "@/components/ledger-table";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { getAdvancesForUser, getUserBalanceCents, getUserLedger } from "@/lib/finance";
import { centsToBRL } from "@/lib/money";
import { listUsers } from "@/lib/queries/users";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export default async function FinancialPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  const currentUser = await requireUser();
  const { user: userParam } = await searchParams;

  const users = await listUsers();
  const targetUser = users.find((u) => u.id === userParam) ?? users.find((u) => u.id === currentUser.id) ?? users[0];

  if (!targetUser) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado ainda.</p>
      </div>
    );
  }

  const [balanceCents, ledger, advances] = await Promise.all([
    getUserBalanceCents(targetUser.id),
    getUserLedger(targetUser.id),
    getAdvancesForUser(targetUser.id),
  ]);

  const totalGeneratedCents = ledger
    .filter((t) => t.type === "TASK_EARNING")
    .reduce((sum, t) => sum + Math.abs(t.amountCents), 0);
  const totalAdvancedCents = ledger
    .filter((t) => t.type === "ADVANCE_CREDIT")
    .reduce((sum, t) => sum + t.amountCents, 0);
  const totalPaidCents = ledger
    .filter((t) => t.type === "PAYMENT")
    .reduce((sum, t) => sum + Math.abs(t.amountCents), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Extrato de {targetUser.name}</p>
        </div>
        <AdvanceFormDialog userId={targetUser.id} />
      </div>

      {users.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {users.map((u) => (
            <Button
              key={u.id}
              size="sm"
              variant={u.id === targetUser.id ? "default" : "outline"}
              nativeButton={false}
              render={<Link href={`/financial?user=${u.id}`} />}
              className={cn(u.id === targetUser.id && "pointer-events-none")}
            >
              {u.name}
            </Button>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={balanceCents >= 0 ? "Saldo de adiantamento" : "Valor a receber"}
          value={centsToBRL(Math.abs(balanceCents))}
        />
        <StatCard label="Total gerado" value={centsToBRL(totalGeneratedCents)} />
        <StatCard label="Total adiantado" value={centsToBRL(totalAdvancedCents)} />
        <StatCard label="Total pago" value={centsToBRL(totalPaidCents)} />
      </div>

      {advances.some((advance) => advance.installments.length > 0) && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Parcelamentos planejados</h2>
          <InstallmentsList advances={advances} />
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Extrato</h2>
        <LedgerTable transactions={ledger} />
      </div>
    </div>
  );
}
