import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Lightbulb,
  Plus,
  Repeat,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import type { Category } from "@/lib/budget-store";
import {
  EXPENSE_CATEGORIES,
  useBudgets,
  useFmt,
  useGoals,
  useTransactions,
} from "@/lib/budget-store";
import {
  buildRecommendations,
  detectSubscriptions,
  detectUnusualSpends,
  monthlySummary,
} from "@/lib/budget-insights";
import { TopBarControls } from "@/components/budget/TopBarControls";

export const Route = createFileRoute("/insights")({
  component: InsightsPage,
});

function InsightsPage() {
  const { transactions } = useTransactions();
  const { budgets } = useBudgets();
  const fmt = useFmt();

  const subs = useMemo(() => detectSubscriptions(transactions), [transactions]);
  const alerts = useMemo(() => detectUnusualSpends(transactions), [transactions]);
  const recs = useMemo(
    () => buildRecommendations(transactions, budgets, subs),
    [transactions, budgets, subs],
  );
  const summary = useMemo(() => monthlySummary(transactions), [transactions]);

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.04] [background-image:radial-gradient(oklch(0.18_0.025_160)_1px,transparent_1px)] [background-size:18px_18px]" />

      <div className="relative mx-auto max-w-6xl px-6 py-10 md:py-14">
        <header className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-10">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground hover:text-ink"
            >
              <ArrowLeft className="h-3 w-3" /> Back to ledger
            </Link>
            <h1 className="font-display mt-3 text-5xl font-semibold leading-[0.95] text-ink md:text-6xl">
              Insights<span className="italic text-leaf">.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              Patterns hiding in your spending — surfaced automatically.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TopBarControls />
            <MonthlyPill summary={summary} fmt={fmt} />
          </div>
        </header>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <RecommendationsCard recs={recs} fmt={fmt} />
          <UnusualCard alerts={alerts} fmt={fmt} />
          <SubscriptionsCard subs={subs} fmt={fmt} />
          <GoalsCard fmt={fmt} />
        </div>

        <div className="mt-6">
          <BudgetsCard summary={summary} fmt={fmt} />
        </div>

        <footer className="mt-16 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          Detections run on your Supabase-stored transactions.
        </footer>
      </div>
    </div>
  );
}

function MonthlyPill({ summary, fmt }: { summary: ReturnType<typeof monthlySummary>; fmt: (n: number) => string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-3">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        This month
      </div>
      <div className="mt-1 flex items-baseline gap-3">
        <span className="font-display text-2xl font-semibold text-ink">
          {fmt(summary.net)}
        </span>
        <span className="text-xs text-muted-foreground">
          <span className="text-leaf">+{fmt(summary.income)}</span> /{" "}
          <span className="text-clay">−{fmt(summary.expense)}</span>
        </span>
      </div>
    </div>
  );
}

function SectionShell({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-lg bg-muted p-1.5 text-ink">{icon}</span>
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
          {subtitle ? (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}

function RecommendationsCard({
  recs,
  fmt,
}: {
  recs: ReturnType<typeof buildRecommendations>;
  fmt: (n: number) => string;
}) {
  return (
    <SectionShell
      icon={<Lightbulb className="h-4 w-4" />}
      title="Savings recommendations"
      subtitle="Tailored to how you've been spending"
    >
      {recs.length === 0 ? (
        <Empty>Nothing to suggest yet — log a few weeks of activity.</Empty>
      ) : (
        <ul className="space-y-2">
          {recs.map((r) => (
            <li
              key={r.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-background/40 p-3"
            >
              <span
                className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  r.severity === "warn"
                    ? "bg-clay/15 text-clay"
                    : r.severity === "good"
                    ? "bg-leaf/15 text-leaf"
                    : "bg-muted text-ink"
                }`}
              >
                {r.severity === "warn" ? (
                  <AlertTriangle className="h-3.5 w-3.5" />
                ) : r.severity === "good" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium text-ink">{r.title}</p>
                  {r.saving ? (
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-leaf">
                      ~{fmt(r.saving)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{r.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  );
}

function UnusualCard({
  alerts,
  fmt,
}: {
  alerts: ReturnType<typeof detectUnusualSpends>;
  fmt: (n: number) => string;
}) {
  return (
    <SectionShell
      icon={<AlertTriangle className="h-4 w-4" />}
      title="Unusual spend alerts"
      subtitle="Charges in the last 30 days that are 2× your typical"
    >
      {alerts.length === 0 ? (
        <Empty>All within range. Nothing unusual.</Empty>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-xl border border-clay/20 bg-clay/5 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {a.note || a.category}{" "}
                  <span className="text-xs text-muted-foreground">· {a.category}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {a.multiplier.toFixed(1)}× your average of {fmt(a.avg)}
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-clay">
                {fmt(a.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  );
}

function SubscriptionsCard({
  subs,
  fmt,
}: {
  subs: ReturnType<typeof detectSubscriptions>;
  fmt: (n: number) => string;
}) {
  const total = subs.reduce((s, x) => s + x.monthlyCost, 0);
  return (
    <SectionShell
      icon={<Repeat className="h-4 w-4" />}
      title="Subscriptions detected"
      subtitle={
        subs.length
          ? `~${fmt(total)} per month across ${subs.length}`
          : "Recurring charges in your history"
      }
    >
      {subs.length === 0 ? (
        <Empty>
          No recurring charges spotted yet. Add a note like "Netflix" to repeated
          expenses to help detection.
        </Empty>
      ) : (
        <ul className="space-y-2">
          {subs.map((s) => (
            <li
              key={s.key}
              className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium capitalize text-ink">
                  {s.note}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.category} · every ~{s.cadenceDays} days · {s.occurrences} charges
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold tabular-nums text-ink">
                  {fmt(s.amount)}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  ≈ {fmt(s.monthlyCost)}/mo
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  );
}

function GoalsCard({ fmt }: { fmt: (n: number) => string }) {
  const { goals, addGoal, updateGoal, removeGoal } = useGoals();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = parseFloat(target);
    if (!name.trim() || !t) return;
    addGoal({ name: name.trim(), target: t, saved: 0 });
    setName("");
    setTarget("");
  };

  return (
    <SectionShell
      icon={<Target className="h-4 w-4" />}
      title="Savings goals"
      subtitle="Track progress toward what matters"
    >
      <form onSubmit={submit} className="mb-4 flex flex-wrap items-end gap-2">
        <div className="min-w-[140px] flex-1 space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Goal
          </Label>
          <Input
            placeholder="Emergency fund"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="w-32 space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Target
          </Label>
          <Input
            type="number"
            placeholder="5000"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>
        <Button type="submit" className="bg-ink text-background hover:bg-ink/90">
          <Plus className="mr-1 h-3.5 w-3.5" /> Add
        </Button>
      </form>

      {goals.length === 0 ? (
        <Empty>No goals yet.</Empty>
      ) : (
        <ul className="space-y-3">
          {goals.map((g) => {
            const pct = Math.min(100, (g.saved / g.target) * 100 || 0);
            return (
              <li
                key={g.id}
                className="rounded-xl border border-border bg-background/40 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{g.name}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {fmt(g.saved)} of {fmt(g.target)} · {Math.round(pct)}%
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      className="h-8 w-24"
                      placeholder="+ add"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const v = parseFloat((e.target as HTMLInputElement).value);
                          if (v) {
                            updateGoal(g.id, { saved: g.saved + v });
                            (e.target as HTMLInputElement).value = "";
                          }
                        }
                      }}
                    />
                    <button
                      onClick={() => removeGoal(g.id)}
                      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-clay"
                      aria-label="Delete goal"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-leaf transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionShell>
  );
}

function BudgetsCard({
  summary,
  fmt,
}: {
  summary: ReturnType<typeof monthlySummary>;
  fmt: (n: number) => string;
}) {
  const { budgets, setBudget, removeBudget } = useBudgets();
  const [cat, setCat] = useState<Category>("Food");
  const [amt, setAmt] = useState("");

  const entries = Object.entries(budgets) as [Category, number][];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amt);
    if (!n) return;
    setBudget(cat, n);
    setAmt("");
  };

  return (
    <SectionShell
      icon={<Target className="h-4 w-4" />}
      title="Category budgets"
      subtitle="Set monthly limits and track them automatically"
    >
      <form onSubmit={submit} className="mb-4 flex flex-wrap items-end gap-2">
        <div className="w-44 space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Category
          </Label>
          <Select value={cat} onValueChange={(v) => setCat(v as Category)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXPENSE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-32 space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Monthly limit
          </Label>
          <Input
            type="number"
            placeholder="400"
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
          />
        </div>
        <Button type="submit" className="bg-ink text-background hover:bg-ink/90">
          <Plus className="mr-1 h-3.5 w-3.5" /> Set
        </Button>
      </form>

      {entries.length === 0 ? (
        <Empty>No budgets set.</Empty>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {entries.map(([c, limit]) => {
            const spent = summary.byCat.get(c) ?? 0;
            const pct = Math.min(100, (spent / limit) * 100 || 0);
            const over = spent > limit;
            return (
              <li
                key={c}
                className="rounded-xl border border-border bg-background/40 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink">{c}</span>
                  <button
                    onClick={() => removeBudget(c)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-clay"
                    aria-label="Remove budget"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-1 flex items-baseline justify-between text-xs tabular-nums text-muted-foreground">
                  <span className={over ? "text-clay font-medium" : undefined}>
                    {fmt(spent)} / {fmt(limit)}
                  </span>
                  <span>{Math.round(pct)}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${over ? "bg-clay" : "bg-leaf"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionShell>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
      {children}
    </div>
  );
}
