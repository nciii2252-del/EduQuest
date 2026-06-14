import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList, Edit, Trash2, Eye, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { INFORMATIKA_TOPICS } from "@/data/topics";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface QuizQuestion {
  id: string;
  quiz_id: string;
  pertanyaan: string;
  pilihan: string[];
  jawaban_benar: number;
  created_at: string;
}

interface StudentScore {
  id: string;
  murid_id: string;
  quiz_id: string;
  skor: number;
  total_benar: number;
  total_soal: number;
  submitted_at: string;
  nama?: string;
}

interface Quiz {
  id: string;
  judul: string;
  topik: string;
  deskripsi?: string;
  total_soal: number;
  durasi_menit: number;
  guru_id: string;
  created_at: string;
  questions?: QuizQuestion[];
  studentScores?: StudentScore[];
}

const sampleQ: QuizQuestion = { id: "", quiz_id: "", pertanyaan: "Soal contoh", pilihan: ["A", "B", "C", "D"], jawaban_benar: 0, created_at: "" };

export default function GuruQuiz() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [view, setView] = useState<"list" | "create" | "detail">("list");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Quiz | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Quiz | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formTopic, setFormTopic] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDuration, setFormDuration] = useState(30);
  const [questions, setQuestions] = useState<QuizQuestion[]>([sampleQ]);
  const [loading, setLoading] = useState(true);

  // Fetch quizzes from database
  useEffect(() => {
    if (user?.id) {
      fetchQuizzes();
    }

    const channel = supabase
      .channel("guru-quiz-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz" }, fetchQuizzes)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_questions" }, fetchQuizzes)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_scores" }, async () => {
        if (view === "detail" && selectedQuiz) {
          const loadedScores = await loadStudentScores(selectedQuiz.id);
          setSelectedQuiz(prev => prev ? { ...prev, studentScores: loadedScores } : prev);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, view, selectedQuiz?.id]);

  const fetchQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from("quiz")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching quizzes:", error);
        toast.error("Gagal memuat quiz");
        return;
      }

      setQuizzes(data || []);
    } catch (err) {
      console.error("Error:", err);
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setFormTitle("");
    setFormTopic("");
    setFormDescription("");
    setFormDuration(30);
    setQuestions([sampleQ]);
    setView("create");
  };

  const openEdit = (q: Quiz) => {
    setEditing(q);
    setFormTitle(q.judul);
    setFormTopic(q.topik);
    setFormDescription(q.deskripsi || "");
    setFormDuration(q.durasi_menit);
    // Load questions for this quiz
    loadQuizQuestions(q.id);
    setView("create");
  };

  const loadQuizQuestions = async (quizId: string) => {
    try {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("created_at");

      if (error) {
        console.error("Error loading questions:", error);
        setQuestions([sampleQ]);
        return [sampleQ];
      }

      const loadedQuestions = (data || []).map((q) => ({
        id: q.id,
        quiz_id: q.quiz_id,
        pertanyaan: q.pertanyaan,
        pilihan: q.pilihan as string[],
        jawaban_benar: q.jawaban_benar,
        created_at: q.created_at,
      }));

      if (loadedQuestions.length > 0) {
        setQuestions(loadedQuestions);
        return loadedQuestions;
      }

      setQuestions([sampleQ]);
      return [sampleQ];
    } catch (err) {
      console.error("Error:", err);
      setQuestions([sampleQ]);
      return [sampleQ];
    }
  };

  const openDetail = async (q: Quiz) => {
    const loadedQuestions = await loadQuizQuestions(q.id);
    const loadedScores = await loadStudentScores(q.id);
    setSelectedQuiz({ ...q, questions: loadedQuestions, studentScores: loadedScores });
    setView("detail");
  };

  const loadStudentScores = async (quizId: string) => {
    try {
      const { data, error } = await supabase
        .from("quiz_scores")
        .select(`
          id,
          murid_id,
          skor,
          total_benar,
          total_soal,
          submitted_at,
          users!quiz_scores_murid_id_fkey (
            nama
          )
        `)
        .eq("quiz_id", quizId)
        .order("submitted_at", { ascending: false });

      if (error) {
        console.error("Error loading scores:", error);
        return [];
      }

      const scores: StudentScore[] = (data || []).map(score => ({
        id: score.id,
        murid_id: score.murid_id,
        quiz_id: quizId,
        skor: score.skor,
        total_benar: score.total_benar,
        total_soal: score.total_soal,
        submitted_at: score.submitted_at,
        nama: (score.users as any)?.nama || "Unknown"
      }));

      return scores;
    } catch (err) {
      console.error("Error:", err);
      return [];
    }
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formTopic) {
      toast.error("Judul dan topik wajib diisi");
      return;
    }

    if (!user?.id) {
      toast.error("User belum login");
      return;
    }

    if (questions.length === 0 || questions.some(q => !q.pertanyaan.trim())) {
      toast.error("Setidaknya satu soal dengan pertanyaan harus diisi");
      return;
    }

    try {
      const quizData = {
        judul: formTitle,
        topik: formTopic,
        deskripsi: formDescription || null,
        total_soal: questions.length,
        durasi_menit: formDuration,
        guru_id: user.id,
      };

      if (editing) {
        // Update existing quiz
        const { data, error } = await supabase
          .from("quiz")
          .update(quizData)
          .eq("id", editing.id)
          .select()
          .single();

        if (error) {
          console.error("Update error:", error);
          toast.error("Gagal memperbarui quiz");
          return;
        }

        // Update questions
        await updateQuizQuestions(editing.id);
        
        setQuizzes(prev => prev.map(q => q.id === editing.id ? data : q));
        toast.success(`Quiz "${formTitle}" berhasil diperbarui`);
      } else {
        // Create new quiz
        const { data, error } = await supabase
          .from("quiz")
          .insert(quizData)
          .select()
          .single();

        if (error) {
          console.error("Insert error:", error);
          toast.error("Gagal menambahkan quiz");
          return;
        }

        // Insert questions
        await insertQuizQuestions(data.id);

        setQuizzes(prev => [data, ...prev]);
        toast.success(`Quiz "${formTitle}" berhasil ditambahkan`);
      }
      setView("list");
    } catch (err) {
      console.error("Error:", err);
      toast.error("Terjadi kesalahan");
    }
  };

  const insertQuizQuestions = async (quizId: string) => {
    const questionsData = questions.map(q => ({
      quiz_id: quizId,
      pertanyaan: q.pertanyaan,
      pilihan: q.pilihan,
      jawaban_benar: q.jawaban_benar,
    }));

    const { error } = await supabase
      .from("quiz_questions")
      .insert(questionsData);

    if (error) {
      console.error("Error inserting questions:", error);
      throw error;
    }
  };

  const updateQuizQuestions = async (quizId: string) => {
    // Delete existing questions
    await supabase
      .from("quiz_questions")
      .delete()
      .eq("quiz_id", quizId);

    // Insert new questions
    await insertQuizQuestions(quizId);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const { error } = await supabase
        .from("quiz")
        .delete()
        .eq("id", deleteTarget.id);

      if (error) {
        console.error("Delete error:", error);
        toast.error("Gagal menghapus quiz");
        return;
      }

      setQuizzes(prev => prev.filter(q => q.id !== deleteTarget.id));
      toast.success(`Quiz "${deleteTarget.judul}" berhasil dihapus`);
      setDeleteDialogOpen(false);
    } catch (err) {
      console.error("Error:", err);
      toast.error("Terjadi kesalahan");
    }
  };

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      { ...sampleQ, pilihan: ["", "", "", ""], jawaban_benar: 0 },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: string | number) => {
    setQuestions(prev => prev.map((question, i) =>
      i === index ? { ...question, [field]: value } : question
    ));
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuestions(prev => prev.map((question, i) =>
      i === questionIndex
        ? {
            ...question,
            pilihan: question.pilihan.map((option, j) => j === optionIndex ? value : option),
          }
        : question
    ));
  };

  if (view === "detail" && selectedQuiz) {
    const avgScore = selectedQuiz.studentScores?.length
      ? Math.round(
          selectedQuiz.studentScores.reduce((sum, student) => sum + student.skor, 0) /
            selectedQuiz.studentScores.length
        )
      : 0;
    const totalParticipants = selectedQuiz.studentScores?.length || 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold">{selectedQuiz.judul}</h2>
            <p className="text-muted-foreground">{selectedQuiz.topik} • {selectedQuiz.questions?.length ?? 0} soal</p>
          </div>
          <Button variant="outline" onClick={() => setView("list")}>← Kembali</Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-5 shadow-card border-0 text-center">
            <p className="text-sm text-muted-foreground">Rata-rata Skor</p>
            <p className="text-3xl font-bold font-display text-primary mt-1">{avgScore}%</p>
          </Card>
          <Card className="p-5 shadow-card border-0 text-center">
            <p className="text-sm text-muted-foreground">Peserta</p>
            <p className="text-3xl font-bold font-display text-xp mt-1">{totalParticipants}</p>
          </Card>
          <Card className="p-5 shadow-card border-0 text-center">
            <p className="text-sm text-muted-foreground">Durasi</p>
            <p className="text-3xl font-bold font-display mt-1">{selectedQuiz.durasi_menit} menit</p>
          </Card>
        </div>

        <Card className="p-6 shadow-card border-0">
          <h3 className="font-display font-semibold text-lg mb-4">Daftar Soal</h3>
          <div className="space-y-4">
            {(selectedQuiz.questions || []).map((q, i) => (
              <div key={i} className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium mb-2">{i + 1}. {q.pertanyaan}</p>
                <div className="grid grid-cols-2 gap-2">
                  {q.pilihan.map((o, j) => (
                    <div key={j} className={`text-sm px-3 py-1.5 rounded ${q.jawaban_benar === j ? "bg-xp/10 text-xp font-medium" : "bg-background"}`}>
                      {String.fromCharCode(65 + j)}. {o}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {selectedQuiz.studentScores && selectedQuiz.studentScores.length > 0 ? (
          <Card className="p-6 shadow-card border-0">
            <h3 className="font-display font-semibold text-lg mb-4">Skor Siswa</h3>
            <div className="space-y-3">
              {selectedQuiz.studentScores.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">{student.nama?.charAt(0) ?? "?"}</span>
                    </div>
                    <div>
                      <p className="font-medium">{student.nama}</p>
                      <p className="text-xs text-muted-foreground">{new Date(student.submitted_at).toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${student.skor < 75 ? "text-destructive" : "text-xp"}`}>
                      {student.skor}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-6 shadow-card border-0 text-center text-muted-foreground">
            Belum ada siswa yang mengerjakan quiz ini.
          </Card>
        )}
      </div>
    );
  }

  if (view === "create") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold">{editing ? "Edit Quiz" : "Buat Quiz Baru"}</h2>
            <p className="text-muted-foreground">Quiz Pemrograman Dasar (Informatika)</p>
          </div>
          <Button variant="outline" onClick={() => setView("list")}>
            ← Kembali
          </Button>
        </div>

        <Card className="p-6 shadow-card border-0">
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Judul Quiz</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="cth: Quiz Struktur Perulangan" />
            </div>
            <div className="space-y-2">
              <Label className="text-base font-semibold">Topik</Label>
              <Select value={formTopic} onValueChange={(value) => setFormTopic(value)}>
                <SelectTrigger><SelectValue placeholder="Pilih topik" /></SelectTrigger>
                <SelectContent>
                  {INFORMATIKA_TOPICS.map((topic) => (
                    <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Deskripsi</Label>
                <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Deskripsi singkat quiz..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label className="text-base font-semibold">Durasi (menit)</Label>
                <Input type="number" value={formDuration} min={5} max={120} onChange={(e) => setFormDuration(Number(e.target.value))} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((question, qIdx) => (
              <div key={qIdx} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-muted-foreground">Soal {qIdx + 1}</span>
                  {questions.length > 1 && (
                    <Button variant="ghost" size="sm" className="text-destructive h-6 w-6 p-0" onClick={() => removeQuestion(qIdx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Pertanyaan</Label>
                  <Textarea value={question.pertanyaan} onChange={(e) => updateQuestion(qIdx, "pertanyaan", e.target.value)} placeholder="Tulis pertanyaan" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {question.pilihan.map((option, oIdx) => (
                    <div key={oIdx} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Opsi {String.fromCharCode(65 + oIdx)}</Label>
                        <input
                          type="radio"
                          name={`correct-${qIdx}`}
                          checked={question.jawaban_benar === oIdx}
                          onChange={() => updateQuestion(qIdx, "jawaban_benar", oIdx)}
                          className="accent-primary"
                        />
                        <span className="text-xs text-muted-foreground">Benar</span>
                      </div>
                      <Input value={option} onChange={(e) => updateOption(qIdx, oIdx, e.target.value)} placeholder={`Jawaban ${String.fromCharCode(65 + oIdx)}`} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={addQuestion}><Plus className="mr-1 h-4 w-4" /> Tambah Soal</Button>
            <Button className="gradient-primary text-primary-foreground ml-auto" onClick={handleSave}>
              {editing ? "Simpan Perubahan" : "Simpan Quiz"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Kelola Quiz Informatika</h2>
          <p className="text-muted-foreground">Quiz untuk 4 topik Pemrograman Dasar (Python)</p>
        </div>
        <Button className="gradient-primary text-primary-foreground" onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Buat Quiz
        </Button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">Memuat quiz...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">Belum ada quiz tersedia</p>
          </div>
        ) : (
          quizzes.map((quiz) => (
            <Card key={quiz.id} className="p-5 shadow-card border-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg gradient-badge">
                    <ClipboardList className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{quiz.judul}</h3>
                    <p className="text-sm text-muted-foreground">{quiz.topik} • {quiz.total_soal} pertanyaan</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openDetail(quiz)}>
                    <Eye className="mr-1 h-3 w-3" /> Lihat
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(quiz)}>
                    <Edit className="mr-1 h-3 w-3" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { setDeleteTarget(quiz); setDeleteDialogOpen(true); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Durasi</span>
                  <span>{quiz.durasi_menit} menit</span>
                </div>
                <Progress value={Math.min(100, quiz.total_soal * 10)} className="h-2" />
              </div>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus <strong>"{deleteTarget?.judul}"</strong>? Semua data pengerjaan murid akan hilang.
            </AlertDialogDescription>
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
