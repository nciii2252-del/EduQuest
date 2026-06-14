import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient?: string;
  subtitle?: string;
}

export function StatCard({ title, value, icon: Icon, gradient = "gradient-primary", subtitle }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 border-0">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold font-display mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-xl ${gradient}`}>
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
      </div>
    </Card>
  );
}
