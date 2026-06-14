import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, ClipboardList, Target, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { getStudentStats, type StudentStats } from "@/services/analyticsService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function MuridProgres() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    fetchStats();

    const channel = supabase
      .channel(`murid-progres-${user.id}`)
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
      toast.error(err.message || "Gagal memuat progres");
    }
  };

  const safeStats = stats || {
    materiSelesai: 0,
    totalMateri: 0,
    quizSelesai: 0,
    totalQuiz: 0,
    avgScore: 0,
    totalProgress: 0,
    topics: [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Progres Belajar</h2>
        <p className="text-muted-foreground">Perkembangan belajar Informatika - Pemrograman Dasar</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Materi Selesai" value={`${safeStats.materiSelesai}/${safeStats.totalMateri}`} icon={BookOpen} gradient="gradient-xp" />
        <StatCard title="Quiz Selesai" value={`${safeStats.quizSelesai}/${safeStats.totalQuiz}`} icon={ClipboardList} gradient="gradient-badge" />
        <StatCard title="Rata-rata Skor" value={`${safeStats.avgScore}%`} icon={Target} gradient="gradient-primary" />
        <StatCard title="Progres Total" value={`${safeStats.totalProgress}%`} icon={TrendingUp} gradient="gradient-xp" />
      </div>

      <div>
        <h3 className="font-display font-semibold text-lg mb-3">Progres per Topik</h3>
        <div className="grid gap-3">
          {safeStats.topics.length === 0 ? (
            <Card className="p-4 shadow-card border-0 text-muted-foreground">Belum ada data progres.</Card>
          ) : safeStats.topics.map(topic => (
            <Card key={topic.name} className="p-4 shadow-card border-0">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold">{topic.name}</p>
                  <p className="text-xs text-muted-foreground">Materi: {topic.materials} • Quiz avg: {topic.quizAvg}%</p>
                </div>
                <span className="font-display font-bold text-lg">{topic.progress}%</span>
              </div>
              <Progress value={topic.progress} className="h-2" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
