import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Trash2, BarChart3, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { deleteQuiz, getAllQuiz, type Quiz } from "@/services/quizService";
import { supabase } from "@/integrations/supabase/client";

interface QuizStats {
  avgScore: number;
  submissions: number;
  scores: Array<{ id: string; nama: string; skor: number }>;
}

export default function AdminQuiz() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Quiz | null>(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [statsQuiz, setStatsQuiz] = useState<Quiz | null>(null);
  const [stats, setStats] = useState<QuizStats>({ avgScore: 0, submissions: 0, scores: [] });

  useEffect(() => {
    fetchQuizzes();

    const channel = supabase
      .channel("admin-quiz-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz" }, fetchQuizzes)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_questions" }, fetchQuizzes)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_scores" }, () => {
        if (statsQuiz) openStats(statsQuiz);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setQuizzes(await getAllQuiz());
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat quiz");
    } finally {
      setLoading(false);
    }
  };

  const filtered = quizzes.filter(q =>
    `${q.judul} ${q.topik} ${q.deskripsi || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const openStats = async (quiz: Quiz) => {
    setStatsQuiz(quiz);
    setStatsDialogOpen(true);

    const { data, error } = await supabase
      .from("quiz_scores")
      .select("id, skor, murid_id, users!quiz_scores_murid_id_fkey(nama)")
      .eq("quiz_id", quiz.id)
      .order("submitted_at", { ascending: false });

    if (error) {
      setStats({ avgScore: 0, submissions: 0, scores: [] });
      return;
    }

    const scores = (data || []).map((row: any) => ({ id: row.id, nama: row.users?.nama || "Murid", skor: row.skor }));
    const avgScore = scores.length
      ? Math.round(scores.reduce((sum, score) => sum + score.skor, 0) / scores.length)
      : 0;

    setStats({ avgScore, submissions: scores.length, scores });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteQuiz(deleteTarget.id);
      setQuizzes(prev => prev.filter(q => q.id !== deleteTarget.id));
      toast.success(`Quiz "${deleteTarget.judul}" berhasil dihapus`);
      setDeleteDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus quiz");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Kelola Quiz</h2>
        <p className="text-muted-foreground">Quiz Informatika dari database yang sama dengan guru dan siswa</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari quiz..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Memuat quiz...</div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">Belum ada quiz</div>
        ) : filtered.map(q => (
          <Card key={q.id} className="p-5 shadow-card border-0 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="p-2 rounded-lg gradient-badge"><ClipboardList className="h-5 w-5 text-primary-foreground" /></div>
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{q.judul}</h3>
                <p className="text-sm text-muted-foreground">{q.topik} - {q.total_soal} soal - {q.durasi_menit} menit</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{q.total_soal} soal</Badge>
              <Button variant="outline" size="sm" onClick={() => openStats(q)}>
                <BarChart3 className="mr-1 h-3 w-3" /> Statistik
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { setDeleteTarget(q); setDeleteDialogOpen(true); }}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Statistik: {statsQuiz?.judul}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Rata-rata</p>
                <p className="text-xl font-bold text-primary">{stats.avgScore}%</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Pengerjaan</p>
                <p className="text-xl font-bold">{stats.submissions}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Soal</p>
                <p className="text-xl font-bold">{statsQuiz?.total_soal || 0}</p>
              </div>
            </div>
            <div className="space-y-2">
              {stats.scores.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada pengerjaan quiz.</p>
              ) : stats.scores.map(score => (
                <div key={score.id} className="flex items-center justify-between py-1 border-b last:border-0">
                  <span className="text-sm">{score.nama}</span>
                  <Badge>{score.skor}%</Badge>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Quiz?</AlertDialogTitle>
            <AlertDialogDescription>Apakah Anda yakin ingin menghapus <strong>"{deleteTarget?.judul}"</strong>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
