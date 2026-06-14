import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { getStudentLeaderboard, type StudentLeaderboardEntry } from "@/services/analyticsService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function GuruProgres() {
  const [students, setStudents] = useState<StudentLeaderboardEntry[]>([]);
  const [totalMaterials, setTotalMaterials] = useState(0);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();

    const channel = supabase
      .channel("guru-progres-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, fetchProgress)
      .on("postgres_changes", { event: "*", schema: "public", table: "student_progress" }, fetchProgress)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_scores" }, fetchProgress)
      .on("postgres_changes", { event: "*", schema: "public", table: "materi" }, fetchProgress)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz" }, fetchProgress)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const [leaderboard, { data: materials }, { data: quizzes }] = await Promise.all([
        getStudentLeaderboard(),
        supabase.from("materi").select("id").eq("status", "published"),
        supabase.from("quiz").select("id"),
      ]);

      setStudents(leaderboard);
      setTotalMaterials(materials?.length || 0);
      setTotalQuizzes(quizzes?.length || 0);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat progres murid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Progres Murid</h2>
        <p className="text-muted-foreground">Pantau perkembangan belajar murid secara real-time</p>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Memuat progres...</p>
        ) : students.length === 0 ? (
          <Card className="p-5 shadow-card border-0 text-center text-muted-foreground">Belum ada data murid.</Card>
        ) : students.map((s) => (
          <Card key={s.murid_id} className="p-5 shadow-card border-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {s.rank}
                </div>
                <div>
                  <p className="font-semibold">{s.nama}</p>
                  <p className="text-xs text-muted-foreground">{s.xp} XP - Level {s.level}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-xp" />
                <span className="font-display font-bold text-lg">{s.materiProgress}%</span>
              </div>
            </div>
            <Progress value={s.materiProgress} className="h-2 mb-3" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Materi Selesai</p>
                <p className="font-semibold">{s.materiDone}/{totalMaterials}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Quiz Dikerjakan</p>
                <p className="font-semibold">{s.quizDone}/{totalQuizzes}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rata-rata Quiz</p>
                <p className={`font-semibold ${s.avgScore < 75 ? "text-destructive" : "text-xp"}`}>{s.avgScore}%</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
