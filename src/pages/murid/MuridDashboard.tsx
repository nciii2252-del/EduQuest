import { BookOpen, ClipboardList, Trophy, Flame } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { LevelBadge } from "@/components/LevelBadge";
import { StreakBadge } from "@/components/StreakBadge";
import { useEffect, useState } from "react";
import { getStudentStats, type StudentStats } from "@/services/analyticsService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function MuridDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    fetchStats();

    const channel = supabase
      .channel(`murid-dashboard-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "users", filter: `id=eq.${user.id}` }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "student_progress", filter: `murid_id=eq.${user.id}` }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_scores", filter: `murid_id=eq.${user.id}` }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "materi" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz" }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchStats = async () => {
    if (!user?.id) return;

    try {
      setStats(await getStudentStats(user.id));
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat dashboard murid");
    }
  };

  if (!user) return null;

  const safeStats = stats || {
    xp: user.xp ?? 0,
    level: user.level ?? 1,
    streak: user.streak ?? 0,
    xpToNext: 500,
    xpProgress: 0,
    materiSelesai: 0,
    totalMateri: 0,
    quizSelesai: 0,
    totalQuiz: 0,
    peringkat: 0,
    totalProgress: 0,
    avgScore: 0,
    topics: [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Halo, {user.nama}!</h2>
        <p className="text-muted-foreground">Lanjutkan perjalanan ngoding-mu di Informatika!</p>
      </div>

      <Card className="p-6 gradient-hero text-primary-foreground border-0 shadow-elevated">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex gap-2 mb-3">
              <LevelBadge level={safeStats.level} />
              <StreakBadge streak={safeStats.streak} />
            </div>
            <p className="text-sm opacity-90">Progres ke Level {safeStats.level + 1}</p>
            <div className="flex items-center gap-3 mt-2">
              <Progress value={safeStats.xpProgress} className="h-3 w-48 bg-primary-foreground/20" />
              <span className="text-sm font-semibold">{safeStats.xp}/{safeStats.xpToNext} XP</span>
            </div>
          </div>
          <div className="text-6xl">💻</div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Materi Selesai" value={`${safeStats.materiSelesai}/${safeStats.totalMateri}`} icon={BookOpen} gradient="gradient-xp" />
        <StatCard title="Quiz Selesai" value={`${safeStats.quizSelesai}/${safeStats.totalQuiz}`} icon={ClipboardList} gradient="gradient-badge" />
        <StatCard title="Peringkat" value={safeStats.peringkat ? `#${safeStats.peringkat}` : "-"} icon={Trophy} gradient="gradient-primary" />
        <StatCard title="Streak" value={`${safeStats.streak} Hari`} icon={Flame} gradient="gradient-badge" />
      </div>

      <div>
        <h3 className="font-display font-semibold text-lg mb-3">Pencapaian</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {safeStats.topics.length === 0 ? (
            <Card className="p-4 text-center shadow-card border-0 text-muted-foreground">Belum ada topik.</Card>
          ) : safeStats.topics.map((topic) => (
            <Card
              key={topic.name}
              className={`p-4 text-center shadow-card border-0 transition-shadow ${topic.achieved ? "hover:shadow-elevated" : "opacity-45 grayscale bg-muted/60"}`}
            >
              <div className="text-3xl mb-2">{topic.achieved ? "🏅" : "🔒"}</div>
              <p className="font-semibold text-sm">{topic.name}</p>
              <p className="text-xs text-muted-foreground mt-1">Materi dibuka dan quiz dikerjakan</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
