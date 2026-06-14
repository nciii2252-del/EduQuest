import { Card } from "@/components/ui/card";
import { XpBadge } from "@/components/XpBadge";
import { LevelBadge } from "@/components/LevelBadge";
import { useEffect, useState } from "react";
import { getStudentLeaderboard, type StudentLeaderboardEntry } from "@/services/analyticsService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const rankColors = ["gradient-badge", "bg-badge-silver", "bg-badge-bronze"];
const rankLabels = ["1", "2", "3"];

export default function MuridLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<StudentLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();

    const channel = supabase
      .channel("murid-leaderboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, fetchLeaderboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "student_progress" }, fetchLeaderboard)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_scores" }, fetchLeaderboard)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setLeaderboard(await getStudentLeaderboard());
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat leaderboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground text-center py-8">Memuat leaderboard...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Papan Peringkat</h2>
        <p className="text-muted-foreground">Peringkat real-time berdasarkan progres siswa di database</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {leaderboard.slice(0, 3).map((s, i) => (
          <Card key={s.murid_id} className={`p-5 text-center shadow-card border-0 ${i === 0 ? "ring-2 ring-badge-gold" : ""}`}>
            <div className="text-2xl font-display font-bold mb-2">#{rankLabels[i]}</div>
            <div className={`w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center text-xl font-bold text-primary-foreground ${rankColors[i]}`}>
              {s.nama[0]}
            </div>
            <p className="font-semibold">{s.nama}</p>
            <p className="text-xs text-muted-foreground mt-1">Progres {s.materiProgress}% • Skor {s.avgScore}%</p>
            <div className="flex flex-col items-center gap-1 mt-2">
              <XpBadge xp={s.xp} />
              <LevelBadge level={s.level} />
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        {leaderboard.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground shadow-card border-0">Belum ada data siswa.</Card>
        ) : leaderboard.slice(3).map(s => (
          <Card key={s.murid_id} className="p-4 shadow-card border-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <span className="text-lg font-display font-bold text-muted-foreground w-8 text-center">{s.rank}</span>
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                  {s.nama[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{s.nama}</p>
                  <p className="text-xs text-muted-foreground">{s.quizDone} quiz • {s.materiDone} materi selesai</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <XpBadge xp={s.xp} />
                <LevelBadge level={s.level} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Progress value={s.materiProgress} className="h-2" />
              <span className="text-xs text-muted-foreground w-10">{s.materiProgress}%</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
