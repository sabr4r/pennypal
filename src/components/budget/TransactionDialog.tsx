import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import type { Category, Transaction, TxType } from "@/lib/budget-store";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  useTransactions,
} from "@/lib/budget-store";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing?: Transaction | null;
}

export function TransactionDialog({ open, onOpenChange, editing }: Props) {
  const { add, update } = useTransactions();
  const isEdit = !!editing;

  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Food");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setAmount(String(editing.amount));
      setCategory(editing.category);
      setNote(editing.note);
      setDate(editing.date.slice(0, 10));
    } else {
      setType("expense");
      setAmount("");
      setCategory("Food");
      setNote("");
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [open, editing]);

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!n || n <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const payload = {
      type,
      amount: n,
      category,
      note: note.trim().slice(0, 80),
      date: new Date(date).toISOString(),
    };
    if (isEdit && editing) {
      await update(editing.id, payload);
      toast.success("Transaction updated");
    } else {
      await add(payload);
      toast.success(`${type === "expense" ? "Expense" : "Income"} added`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {isEdit ? "Edit transaction" : "Log a transaction"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-full bg-muted p-1">
            {(["expense", "income"] as TxType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  if (!isEdit) setCategory(t === "expense" ? "Food" : "Salary");
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  type === t
                    ? t === "expense"
                      ? "bg-clay text-background"
                      : "bg-leaf text-background"
                    : "text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Input
              id="note"
              placeholder="Optional"
              value={note}
              maxLength={80}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full bg-ink text-background hover:bg-ink/90">
            {isEdit ? "Save changes" : "Add transaction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
