import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AddTransaction } from "@/components/budget/AddTransaction";
import { TrendingUp, TrendingDown, Wallet, Sparkles } from "lucide-react";
import { CategoryChart } from "@/components/budget/CategoryChart";
import { TrendChart } from "@/components/budget/TrendChart";
import { TransactionList } from "@/components/budget/TransactionList";
import { TopBarControls } from "@/components/budget/TopBarControls";
import { useFmt, useTransactions } from "@/lib/budget-store";


export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { transactions } = useTransactions();
  const fmt = useFmt();

  const { income, expense, balance, topCat } = useMemo(() => {
    let income = 0;
    let expense = 0;
    const cats = new Map<string, number>();
    transactions.forEach((t) => {
      if (t.type === "income") income += t.amount;
      else {
        expense += t.amount;
        cats.set(t.category, (cats.get(t.category) ?? 0) + t.amount);
      }
    });
    const topCat =
      Array.from(cats.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    return { income, expense, balance: income - expense, topCat };
  }, [transactions]);

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />

      <div className="pointer-events-none fixed inset-0 opacity-[0.04] [background-image:radial-gradient(oklch(0.18_0.025_160)_1px,transparent_1px)] [background-size:18px_18px]" />

      <div className="relative mx-auto max-w-6xl px-6 py-10 md:py-14">
        <header className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.24em] text-leaf">
              <span className="h-1.5 w-1.5 rounded-full bg-leaf" />
              Penny Pal
            </div>
            <h1 className="font-display mt-3 text-5xl font-semibold leading-[0.95] text-ink md:text-6xl">
              Your money,
              <br />
              <span className="italic text-leaf">in clear view.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              A quiet ledger for tracking what comes in, what goes out, and where it goes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TopBarControls />
            <Link
              to="/insights"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-muted"
            >
              <Sparkles className="h-3.5 w-3.5 text-leaf" /> Insights
            </Link>
            <AddTransaction />
          </div>
        </header>

        <section className="mt-10">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="grid grid-cols-3 divide-x divide-border">
              <div className="px-4 first:pl-0">
                <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  <Wallet className="h-3 w-3" /> Balance
                </div>
                <div className="font-display mt-2 text-xl font-semibold text-ink md:text-2xl">
                  {fmt(balance)}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {transactions.length} entries
                </div>
              </div>
              <div className="px-4">
                <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  <TrendingUp className="h-3 w-3 text-leaf" /> Income
                </div>
                <div className="font-display mt-2 text-xl font-semibold text-leaf md:text-2xl">
                  {fmt(income)}
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">All-time inflow</div>
              </div>
              <div className="px-4 last:pr-0">
                <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  <TrendingDown className="h-3 w-3 text-clay" /> Expenses
                </div>
                <div className="font-display mt-2 text-xl font-semibold text-clay md:text-2xl">
                  {fmt(expense)}
                </div>
                <div className="mt-1 truncate text-[11px] text-muted-foreground">
                  Top: {topCat}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 flex items-baseline justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Cash flow
                </div>
                <h2 className="font-display mt-1 text-2xl font-semibold text-ink">
                  Last 14 days
                </h2>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-leaf" /> Income
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-clay" /> Expense
                </span>
              </div>
            </div>
            <TrendChart transactions={transactions} />
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Recent activity
            </h2>
            <span className="text-xs text-muted-foreground">
              Showing latest {Math.min(12, transactions.length)} of {transactions.length}
            </span>
          </div>
          <TransactionList transactions={transactions} />
        </section>

        <section className="mt-6">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                By category
              </div>
              <h2 className="font-display mt-1 text-2xl font-semibold text-ink">
                Where it goes
              </h2>
            </div>
            <CategoryChart transactions={transactions} />
          </div>
        </section>

        <footer className="mt-16 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          Data synced to your account via Supabase.
        </footer>
      </div>
    </div>
  );
}
