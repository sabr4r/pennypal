import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Transaction } from "@/lib/budget-store";
import { useFmt } from "@/lib/budget-store";

export function TrendChart({ transactions }: { transactions: Transaction[] }) {
  const fmt = useFmt();

  const data = useMemo(() => {
    const map = new Map<string, { date: string; expense: number; income: number }>();
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, {
        date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        expense: 0,
        income: 0,
      });
    }
    transactions.forEach((t) => {
      const key = t.date.slice(0, 10);
      const row = map.get(key);
      if (!row) return;
      if (t.type === "expense") row.expense += t.amount;
      else row.income += t.amount;
    });
    return Array.from(map.values());
  }, [transactions]);

  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="exp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.62 0.14 35)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="oklch(0.62 0.14 35)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.45 0.12 158)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="oklch(0.45 0.12 158)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={50} />
          <Tooltip
            formatter={(v: number) => fmt(v)}
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Area type="monotone" dataKey="income" stroke="oklch(0.45 0.12 158)" strokeWidth={2} fill="url(#inc)" />
          <Area type="monotone" dataKey="expense" stroke="oklch(0.62 0.14 35)" strokeWidth={2} fill="url(#exp)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
