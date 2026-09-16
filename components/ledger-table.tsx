import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { getUserLedger } from "@/lib/finance";
import { centsToBRL } from "@/lib/money";
import { formatDateTimeShort } from "@/lib/timezone";

type Transaction = Awaited<ReturnType<typeof getUserLedger>>[number];

const TYPE_LABEL: Record<string, string> = {
  TASK_EARNING: "Tarefa",
  ADVANCE_CREDIT: "Adiantamento",
  PAYMENT: "Pagamento",
  ADJUSTMENT: "Ajuste",
};

export function LedgerTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {formatDateTimeShort(tx.createdAt)}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{TYPE_LABEL[tx.type] ?? tx.type}</Badge>
              </TableCell>
              <TableCell className="text-sm">
                {tx.taskOccurrence?.taskTemplate?.title ?? tx.description}
              </TableCell>
              <TableCell
                className={`text-right font-medium ${
                  tx.amountCents >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {tx.amountCents >= 0 ? "+" : "-"}
                {centsToBRL(Math.abs(tx.amountCents))}
              </TableCell>
            </TableRow>
          ))}
          {transactions.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma movimentação ainda.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
