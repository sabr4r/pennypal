import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

export type TxType = 'expense' | 'income';

export type Category =
  | 'Food' | 'Transport' | 'Housing' | 'Entertainment'
  | 'Health' | 'Shopping' | 'Bills' | 'Salary'
  | 'Freelance' | 'Investments' | 'Other';

export const EXPENSE_CATEGORIES: Category[] = ['Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Shopping', 'Bills', 'Other'];
export const INCOME_CATEGORIES: Category[] = ['Salary', 'Freelance', 'Investments', 'Other'];

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  category: Category;
  note: string;
  date: string;
}

export const CURRENCIES = [
  { code: 'USD', label: 'USD $' }, { code: 'EUR', label: 'EUR €' },
  { code: 'GBP', label: 'GBP £' }, { code: 'INR', label: 'INR ₹' },
  { code: 'JPY', label: 'JPY ¥' }, { code: 'CAD', label: 'CAD $' },
  { code: 'AUD', label: 'AUD $' }, { code: 'CHF', label: 'CHF' },
  { code: 'CNY', label: 'CNY ¥' }, { code: 'AED', label: 'AED د.إ' },
] as const;

export function formatCurrency(n: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}

export function useFmt() {
  const { currency } = useCurrency();
  return (n: number) => formatCurrency(n, currency);
}

// Module-level broadcast: when any write completes, all hook instances reload.
type Listener = () => void;
const txListeners = new Set<Listener>();
function notifyTx() { txListeners.forEach((fn) => fn()); }

// ---- Transactions ----
export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    if (error) console.error('load transactions:', error.message);
    if (data) setTransactions(data as Transaction[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    txListeners.add(load);
    return () => { txListeners.delete(load); };
  }, [load]);

  const add = async (t: Omit<Transaction, 'id'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('transactions').insert({ ...t, user_id: user!.id });
    if (error) { console.error('add transaction:', error.message); return; }
    notifyTx();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) { console.error('remove transaction:', error.message); return; }
    notifyTx();
  };

  const update = async (id: string, patch: Partial<Omit<Transaction, 'id'>>) => {
    const { error } = await supabase.from('transactions').update(patch).eq('id', id);
    if (error) { console.error('update transaction:', error.message); return; }
    notifyTx();
  };

  return { transactions, loading, add, remove, update };
}

// ---- Currency ----
export function useCurrency() {
  const [currency, setCurrencyState] = useState('USD');

  useEffect(() => {
    supabase.from('settings').select('currency').single().then(({ data }) => {
      if (data?.currency) setCurrencyState(data.currency);
    });
  }, []);

  const setCurrency = async (c: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('settings').upsert({ user_id: user!.id, currency: c }, { onConflict: 'user_id' });
    setCurrencyState(c);
  };

  return { currency, setCurrency };
}

// ---- Budgets ----
export type Budgets = Partial<Record<Category, number>>;

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budgets>({});

  const load = useCallback(async () => {
    const { data } = await supabase.from('budgets').select('category, amount');
    if (data) {
      const b: Budgets = {};
      data.forEach((row) => { b[row.category as Category] = row.amount; });
      setBudgets(b);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setBudget = async (c: Category, amount: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('budgets').upsert({ user_id: user!.id, category: c, amount }, { onConflict: 'user_id,category' });
    await load();
  };

  const removeBudget = async (c: Category) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('budgets').delete().eq('user_id', user!.id).eq('category', c);
    await load();
  };

  return { budgets, setBudget, removeBudget };
}

// ---- Goals ----
export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline?: string;
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from('goals').select('*').order('created_at');
    if (data) setGoals(data as Goal[]);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addGoal = async (g: Omit<Goal, 'id'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('goals').insert({ ...g, user_id: user!.id });
    await load();
  };

  const updateGoal = async (id: string, patch: Partial<Omit<Goal, 'id'>>) => {
    await supabase.from('goals').update(patch).eq('id', id);
    await load();
  };

  const removeGoal = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id);
    await load();
  };

  return { goals, addGoal, updateGoal, removeGoal };
}
