import { Users, GraduationCap, BookOpen, ClipboardList, TrendingUp, Activity, ArrowRight } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getPlatformStats, getRecentActivities, type ActivityItem } from "@/services/analyticsService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PlatformStats {
  totalGuru: number;
  totalMurid: number;
  totalMateri: number;
  totalQuiz: number;
  avgScore: number;
  activeStudents: number;
  completedMaterialsThisWeek: number;
  quizSubmissionsThisWeek: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats>({
    totalGuru: 0,
    totalMurid: 0,
    totalMateri: 0,
    totalQuiz: 0,
    avgScore: 0,
    activeStudents: 0,
    completedMaterialsThisWeek: 0,
    quizSubmissionsThisWeek: 0,
  });
  const [logs, setLogs] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetchDashboard();

    const channel = supabase
      .channel("admin-dashboard-realtime")
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
      const [platformStats, recentLogs] = await Promise.all([
        getPlatformStats(),
        getRecentActivities(5),
      ]);
      setStats(platformStats);
      setLogs(recentLogs);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat dashboard admin");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Dashboard Admin</h2>
        <p className="text-muted-foreground">Kelola platform CodeQuest - Informatika Pemrograman Dasar</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cursor-pointer" onClick={() => navigate("/admin/guru")}>
          <StatCard title="Total Guru" value={stats.totalGuru} icon={GraduationCap} gradient="gradient-primary" subtitle="Dari database" />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/admin/murid")}>
          <StatCard title="Total Murid" value={stats.totalMurid} icon={Users} gradient="gradient-xp" subtitle="Dari database" />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/admin/materi")}>
          <StatCard title="Total Materi" value={stats.totalMateri} icon={BookOpen} gradient="gradient-badge" subtitle="Published dan draft" />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/admin/quiz")}>
          <StatCard title="Total Quiz" value={stats.totalQuiz} icon={ClipboardList} gradient="gradient-primary" subtitle="Semua quiz" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 shadow-card border-0">
          <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Log Aktivitas
          </h3>
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>
            ) : logs.map((l, i) => (
              <div key={`${l.createdAt}-${i}`} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">{l.type}</Badge>
                  <p className="text-sm">{l.text}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{l.time}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 shadow-card border-0">
          <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-xp" /> Statistik Platform
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Rata-rata skor quiz</span><span className="font-bold">{stats.avgScore}%</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Murid aktif minggu ini</span><span className="font-bold">{stats.activeStudents}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Materi selesai/minggu</span><span className="font-bold">{stats.completedMaterialsThisWeek}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Quiz dikerjakan/minggu</span><span className="font-bold">{stats.quizSubmissionsThisWeek}</span></div>
          </div>
          <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/admin/pengaturan")}>
            Pengaturan Platform <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Card>
      </div>
    </div>
  );
}
