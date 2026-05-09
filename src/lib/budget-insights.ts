import type { Category, Transaction } from './budget-store';

export interface Subscription {
  key: string;
  note: string;
  category: Category;
  amount: number;
  occurrences: number;
  lastDate: string;
  cadenceDays: number;
  monthlyCost: number;
}

export interface SpendAlert {
  id: string;
  category: Category;
  amount: number;
  date: string;
  note: string;
  avg: number;
  multiplier: number;
}

export interface Recommendation {
  id: string;
  title: string;
  detail: string;
  saving?: number;
  severity: 'info' | 'warn' | 'good';
}

const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);

export function detectSubscriptions(transactions: Transaction[]): Subscription[] {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const groups = new Map<string, Transaction[]>();
  for (const t of expenses) {
    const note = (t.note || '').trim().toLowerCase();
    if (!note) continue;
    const key = `${t.category}::${note}`;
    const arr = groups.get(key) ?? [];
    arr.push(t);
    groups.set(key, arr);
  }
  const subs: Subscription[] = [];
  for (const [key, txs] of groups) {
    if (txs.length < 2) continue;
    const sorted = [...txs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const avgAmt = sorted.reduce((s, t) => s + t.amount, 0) / sorted.length;
    const consistent = sorted.every((t) => Math.abs(t.amount - avgAmt) / avgAmt <= 0.15);
    if (!consistent) continue;
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push((new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) / 86400000);
    }
    const cadence = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const isWeekly = cadence >= 5 && cadence <= 9;
    const isMonthly = cadence >= 25 && cadence <= 35;
    const isYearly = cadence >= 340 && cadence <= 380;
    if (!isWeekly && !isMonthly && !isYearly) continue;
    const monthlyCost = isWeekly ? avgAmt * 4.33 : isMonthly ? avgAmt : avgAmt / 12;
    subs.push({ key, note: sorted[0].note, category: sorted[0].category, amount: avgAmt, occurrences: sorted.length, lastDate: sorted[sorted.length - 1].date, cadenceDays: Math.round(cadence), monthlyCost });
  }
  return subs.sort((a, b) => b.monthlyCost - a.monthlyCost);
}

export function detectUnusualSpends(transactions: Transaction[]): SpendAlert[] {
  const byCat = new Map<Category, Transaction[]>();
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    const arr = byCat.get(t.category) ?? [];
    arr.push(t);
    byCat.set(t.category, arr);
  }
  const alerts: SpendAlert[] = [];
  const cutoff = Date.now() - 30 * 86400000;
  for (const [cat, list] of byCat) {
    if (list.length < 4) continue;
    const avg = list.reduce((s, t) => s + t.amount, 0) / list.length;
    for (const t of list) {
      if (new Date(t.date).getTime() < cutoff) continue;
      if (t.amount >= avg * 2 && t.amount - avg > 20) {
        alerts.push({ id: t.id, category: cat, amount: t.amount, date: t.date, note: t.note, avg, multiplier: t.amount / avg });
      }
    }
  }
  return alerts.sort((a, b) => b.multiplier - a.multiplier);
}

export function buildRecommendations(
  transactions: Transaction[],
  budgets: Partial<Record<Category, number>>,
  subs: Subscription[],
  fmt: (n: number) => string = (n) => `$${Math.round(n)}`,
): Recommendation[] {
  const recs: Recommendation[] = [];
  const now = new Date();
  const monthStart = startOfMonth(now).getTime();
  const monthExpense = new Map<Category, number>();
  let monthIncome = 0;
  let monthSpend = 0;
  for (const t of transactions) {
    if (new Date(t.date).getTime() < monthStart) continue;
    if (t.type === 'income') monthIncome += t.amount;
    else {
      monthSpend += t.amount;
      monthExpense.set(t.category, (monthExpense.get(t.category) ?? 0) + t.amount);
    }
  }
  for (const [cat, limit] of Object.entries(budgets) as [Category, number][]) {
    const spent = monthExpense.get(cat) ?? 0;
    if (spent > limit) {
      recs.push({ id: `over-${cat}`, severity: 'warn', title: `Over budget on ${cat}`, detail: `You've spent ${fmt(spent)} of your ${fmt(limit)} ${cat} budget this month.`, saving: spent - limit });
    } else if (limit > 0 && spent / limit < 0.5) {
      recs.push({ id: `under-${cat}`, severity: 'good', title: `Under budget on ${cat}`, detail: `Only ${fmt(spent)} of ${fmt(limit)} used — nice.` });
    }
  }
  const subTotal = subs.reduce((s, x) => s + x.monthlyCost, 0);
  if (subs.length >= 2) {
    recs.push({ id: 'sub-stack', severity: 'info', title: `Recurring charges add up to ~${fmt(subTotal)}/mo`, detail: `${subs.length} likely subscriptions detected. Cancel one you don't use to free cash for savings.`, saving: subTotal });
  }
  if (monthIncome > 0) {
    const rate = (monthIncome - monthSpend) / monthIncome;
    if (rate < 0.1) {
      recs.push({ id: 'save-rate', severity: 'warn', title: `Low savings rate (${Math.round(rate * 100)}%)`, detail: `Try to keep ~20% of income. That'd be about ${fmt(monthIncome * 0.2)} this month.` });
    } else if (rate >= 0.2) {
      recs.push({ id: 'save-rate-good', severity: 'good', title: `Healthy savings rate (${Math.round(rate * 100)}%)`, detail: `You kept ${fmt(monthIncome - monthSpend)} of ${fmt(monthIncome)} this month.` });
    }
  }
  const top = [...monthExpense.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top && monthSpend > 0 && top[1] / monthSpend > 0.4) {
    recs.push({ id: `top-${top[0]}`, severity: 'info', title: `${top[0]} dominates your spending`, detail: `${Math.round((top[1] / monthSpend) * 100)}% of this month went to ${top[0]}. Setting a budget could trim it.` });
  }
  return recs;
}

export function monthlySummary(transactions: Transaction[]) {
  const now = new Date();
  const monthStart = startOfMonth(now).getTime();
  let income = 0;
  let expense = 0;
  const byCat = new Map<Category, number>();
  for (const t of transactions) {
    if (new Date(t.date).getTime() < monthStart) continue;
    if (t.type === 'income') income += t.amount;
    else {
      expense += t.amount;
      byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
    }
  }
  return { income, expense, net: income - expense, byCat };
}
