import { Star } from "lucide-react";

export function LevelBadge({ level }: { level: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-level text-primary-foreground text-sm font-semibold">
      <Star className="h-3.5 w-3.5" />
      Level {level}
    </div>
  );
}
