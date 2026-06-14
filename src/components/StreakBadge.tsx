import { Flame } from "lucide-react";

export function StreakBadge({ streak }: { streak: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-streak text-primary-foreground text-sm font-semibold">
      <Flame className="h-3.5 w-3.5" />
      {streak} Hari
    </div>
  );
}
