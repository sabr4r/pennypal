import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES, useCurrency } from "@/lib/budget-store";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export function TopBarControls() {
  const { currency, setCurrency } = useCurrency();

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={currency} onValueChange={setCurrency}>
        <SelectTrigger className="h-9 w-[110px] rounded-full border-border bg-surface text-xs font-medium">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((c) => (
            <SelectItem key={c.code} value={c.code} className="text-xs">
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        onClick={signOut}
        className="h-9 rounded-full gap-1.5 text-xs"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </Button>
    </div>
  );
}
