import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AddTransaction } from "@/components/budget/AddTransaction";
import { TrendingUp, TrendingDown, Wallet, Sparkles, ChevronDown } from "lucide-react";
import { CategoryChart } from "@/components/budget/CategoryChart";
import { TrendChart } from "@/components/budget/TrendChart";
import { TransactionList } from "@/components/budget/TransactionList";
import { TopBarControls } from "@/components/budget/TopBarControls";
import { useFmt, useTransactions } from "@/lib/budget-store";
import type { Transaction } from "@/lib/budget-store";


export const Route = createFileRoute("/")({
  component: Index,
});

type TrendDays = 7 | 14 | 30 | 90;
type FilterPeriod = "all" | "this-month" | "last-month" | "last-3-months" | "custom";

const TREND_OPTIONS: { label: string; value: TrendDays }[] = [
  { label: "7d", value: 7 },
  { label: "14d", value: 14 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
];

const FILTER_OPTIONS: { label: string; value: FilterPeriod }[] = [
  { label: "All time", value: "all" },
  { label: "This month", value: "this-month" },
  { label: "Last month", value: "last-month" },
  { label: "Last 3 months", value: "last-3-months" },
  { label: "Custom", value: "custom" },
];

function filterTransactions(
  txs: Transaction[],
  period: FilterPeriod,
  customFrom: string,
  customTo: string,
): Transaction[] {
  if (period === "all") return txs;
  const now = new Date();
  let from: Date;
  let to: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (period === "this-month") {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "last-month") {
    from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    to = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "last-3-months") {
    from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  } else {
    from = customFrom ? new Date(customFrom) : new Date(0);
    to = customTo ? new Date(new Date(customTo).getTime() + 86400000) : to;
  }
  return txs.filter((t) => {
    const d = new Date(t.date);
    return d >= from && d < to;
  });
}

function Index() {
  const { transactions } = useTransactions();
  const fmt = useFmt();
  const [trendDays, setTrendDays] = useState<TrendDays>(14);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, filterPeriod, customFrom, customTo),
    [transactions, filterPeriod, customFrom, customTo],
  );

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
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Cash flow
                </div>
                <h2 className="font-display mt-1 text-2xl font-semibold text-ink">
                  Last {trendDays} days
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-leaf" /> Income
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-clay" /> Expense
                  </span>
                </div>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  {TREND_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTrendDays(opt.value)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        trendDays === opt.value
                          ? "bg-ink text-background"
                          : "bg-surface text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <TrendChart transactions={transactions} days={trendDays} />
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Recent activity
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-muted"
                >
                  {FILTER_OPTIONS.find((o) => o.value === filterPeriod)?.label ?? "Filter"}
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
                {showFilterMenu && (
                  <div className="absolute right-0 z-10 mt-1 w-44 rounded-xl border border-border bg-surface shadow-lg">
                    {FILTER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setFilterPeriod(opt.value); setShowFilterMenu(false); }}
                        className={`flex w-full items-center px-3 py-2 text-left text-xs transition-colors hover:bg-muted first:rounded-t-xl last:rounded-b-xl ${
                          filterPeriod === opt.value ? "font-semibold text-ink" : "text-muted-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {filterPeriod === "custom" && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-ink focus:outline-none"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-ink focus:outline-none"
                  />
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                {filteredTransactions.length} of {transactions.length} entries
              </span>
            </div>
          </div>
          <TransactionList transactions={filteredTransactions} />
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
