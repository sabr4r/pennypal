import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Transaction } from "@/lib/budget-store";
import { useFmt } from "@/lib/budget-store";
import { TransactionList } from "./TransactionList";

const PALETTE = [
  "var(--cat-1)",
  "var(--cat-2)",
  "var(--cat-3)",
  "var(--cat-4)",
  "var(--cat-5)",
  "var(--cat-6)",
  "var(--cat-7)",
  "var(--cat-8)",
];

export function CategoryChart({ transactions }: { transactions: Transaction[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const fmt = useFmt();

  const data = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + t.amount));
    return Array.from(map, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value,
    );
  }, [transactions]);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (!data.length) {
    return (
      <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
        No expenses yet — add one to see the breakdown.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
      <div className="relative h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={75}
              outerRadius={120}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) => fmt(v)}
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Total
          </div>
          <div className="font-display text-3xl font-semibold text-ink">
            {fmt(total)}
          </div>
        </div>
      </div>

      <div className="space-y-3 self-center">
        {data.map((d, i) => {
          const pct = (d.value / total) * 100;
          const isOpen = expanded === d.name;
          const items = transactions
            .filter((t) => t.type === "expense" && t.category === d.name)
            .sort((a, b) => +new Date(b.date) - +new Date(a.date));
          return (
            <div key={d.name} className="space-y-1.5">
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : d.name)}
                className="flex w-full items-center justify-between text-left text-sm"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-2">
                  <ChevronDown
                    className={`h-3 w-3 text-muted-foreground transition-transform ${isOpen ? "" : "-rotate-90"}`}
                  />
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: PALETTE[i % PALETTE.length] }}
                  />
                  <span className="font-medium text-ink">{d.name}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-ink">{fmt(d.value)}</span>
                  <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                </div>
              </button>
              <div className="h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: PALETTE[i % PALETTE.length],
                  }}
                />
              </div>
              {isOpen && (
                <div className="pt-2">
                  <TransactionList transactions={items} limit={items.length} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
