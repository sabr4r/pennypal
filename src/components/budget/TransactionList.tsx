import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import type { Transaction } from "@/lib/budget-store";
import { useFmt, useTransactions } from "@/lib/budget-store";
import { TransactionDialog } from "./TransactionDialog";

export function TransactionList({
  transactions,
  limit = 12,
}: {
  transactions: Transaction[];
  limit?: number;
}) {
  const { remove } = useTransactions();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const fmt = useFmt();

  if (!transactions.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        No transactions yet.
      </div>
    );
  }

  return (
    <>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {transactions.slice(0, limit).map((t) => {
          const isExpense = t.type === "expense";
          return (
            <li key={t.id} className="group flex items-center gap-3 px-3 py-1.5 text-sm transition-colors hover:bg-muted/40">
              {isExpense ? (
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-clay" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 shrink-0 text-leaf" />
              )}
              <span className="w-20 shrink-0 truncate text-xs font-medium text-ink">{t.category}</span>
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                {t.note || "—"}
              </span>
              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              <span className={`shrink-0 w-20 text-right text-sm font-semibold tabular-nums ${isExpense ? "text-clay" : "text-leaf"}`}>
                {isExpense ? "−" : "+"}
                {fmt(t.amount)}
              </span>
              <button
                onClick={() => setEditing(t)}
                className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-ink group-hover:opacity-100"
                aria-label="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => remove(t.id)}
                className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-clay group-hover:opacity-100"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          );
        })}
      </ul>
      <TransactionDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        editing={editing}
      />
    </>
  );
}
