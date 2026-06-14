import { Users, BookOpen, ClipboardList, TrendingUp, ArrowRight } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getRecentActivities, getStudentLeaderboard, type ActivityItem, type StudentLeaderboardEntry } from "@/services/analyticsService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface DashboardStats {
  totalMurid: number;
  totalMateri: number;
  totalQuiz: number;
  avgScore: number;
}

interface PendingQuiz {
  title: string;
  pending: number;
}

export default function GuruDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ totalMurid: 0, totalMateri: 0, totalQuiz: 0, avgScore: 0 });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [topStudents, setTopStudents] = useState<StudentLeaderboardEntry[]>([]);
  const [pendingQuizzes, setPendingQuizzes] = useState<PendingQuiz[]>([]);

  useEffect(() => {
    fetchDashboard();

    const channel = supabase
      .channel("guru-dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, fetchDashboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "materi" }, fetchDashboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz" }, fetchDashboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_scores" }, fetchDashboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "student_progress" }, fetchDashboard)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboard = async () => {
    try {
      const [
        { data: students, error: studentsError },
        { data: materials, error: materialsError },
        { data: quizzes, error: quizzesError },
        { data: scores, error: scoresError },
        activitiesData,
        leaderboard,
      ] = await Promise.all([
        supabase.from("users").select("id").eq("role", "murid"),
        supabase.from("materi").select("id").eq("status", "published"),
        supabase.from("quiz").select("id, judul"),
        supabase.from("quiz_scores").select("murid_id, quiz_id, skor"),
        getRecentActivities(5),
        getStudentLeaderboard(),
      ]);

      if (studentsError) throw studentsError;
      if (materialsError) throw materialsError;
      if (quizzesError) throw quizzesError;
      if (scoresError) throw scoresError;

      const allScores = scores || [];
      const avgScore = allScores.length
        ? Math.round(allScores.reduce((sum: number, score: any) => sum + (score.skor || 0), 0) / allScores.length)
        : 0;

      const totalStudents = students?.length || 0;
      const pending = (quizzes || []).map((quiz: any) => {
        const done = new Set(allScores.filter((score: any) => score.quiz_id === quiz.id).map((score: any) => score.murid_id)).size;
        return { title: quiz.judul, pending: Math.max(0, totalStudents - done) };
      });

      setStats({
        totalMurid: totalStudents,
        totalMateri: materials?.length || 0,
        totalQuiz: quizzes?.length || 0,
        avgScore,
      });
      setActivities(activitiesData);
      setTopStudents(leaderboard.slice(0, 3));
      setPendingQuizzes(pending);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat dashboard guru");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Dashboard Guru Informatika</h2>
        <p className="text-muted-foreground">Selamat datang kembali, {user?.nama || "Guru"}!</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cursor-pointer" onClick={() => navigate("/guru/murid")}>
          <StatCard title="Total Murid" value={stats.totalMurid} icon={Users} gradient="gradient-primary" subtitle="Data real-time" />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/guru/materi")}>
          <StatCard title="Materi" value={stats.totalMateri} icon={BookOpen} gradient="gradient-xp" subtitle="Materi published" />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/guru/quiz")}>
          <StatCard title="Quiz" value={stats.totalQuiz} icon={ClipboardList} gradient="gradient-badge" subtitle="Dari database" />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/guru/progres")}>
          <StatCard title="Rata-rata Skor" value={`${stats.avgScore}%`} icon={TrendingUp} gradient="gradient-primary" subtitle="Semua pengerjaan quiz" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 shadow-card border-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg">Aktivitas Terbaru</h3>
          </div>
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>
            ) : activities.map((item, i) => (
              <div key={`${item.createdAt}-${i}`} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">{item.type}</Badge>
                  <p className="text-sm">{item.text}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{item.time}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 shadow-card border-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg">Top Murid</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate("/guru/progres")}>
                Lihat Semua <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-3">
              {topStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada data murid.</p>
              ) : topStudents.map((s) => (
                <div key={s.murid_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {s.rank}
                    </div>
                    <span className="font-medium text-sm">{s.nama}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-xp/10 text-xp border-0">{s.xp} XP</Badge>
                    <span className="text-sm font-bold">{s.avgScore}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 shadow-card border-0">
            <h3 className="font-display font-semibold text-lg mb-4">Quiz Belum Selesai</h3>
            <div className="space-y-3">
              {pendingQuizzes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada quiz.</p>
              ) : pendingQuizzes.map((q) => (
                <div key={q.title} className="flex items-center justify-between">
                  <span className="text-sm">{q.title}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{q.pending} murid belum</Badge>
                    <Button variant="outline" size="sm" onClick={() => navigate("/guru/quiz")}>Detail</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
