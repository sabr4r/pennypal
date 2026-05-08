import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionDialog } from "./TransactionDialog";

export function AddTransaction() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size="lg"
        onClick={() => setOpen(true)}
        className="gap-2 rounded-full bg-ink text-background hover:bg-ink/90"
      >
        <Plus className="h-4 w-4" />
        New transaction
      </Button>
      <TransactionDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
