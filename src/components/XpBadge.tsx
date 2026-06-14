import { Zap } from "lucide-react";

export function XpBadge({ xp }: { xp: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full gradient-xp text-xp-foreground text-sm font-semibold">
      <Zap className="h-3.5 w-3.5" />
      {xp.toLocaleString()} XP
    </div>
  );
}
