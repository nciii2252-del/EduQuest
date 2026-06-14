import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Clock, Star, Play, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import QuizPlayer from "@/components/QuizPlayer";
import QuizResult from "@/components/QuizResult";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { LeaderboardEntry, QuizData } from "@/data/quizData";
import { addStudentXp } from "@/services/analyticsService";

type ViewState =
  | { mode: "list" }
  | { mode: "playing"; quizId: string }
  | { mode: "result"; quizId: string; answers: number[]; timeSpent: number; leaderboard: LeaderboardEntry[] };

interface QuizRow {
  id: string;
  judul: string;
  deskripsi?: string | null;
  topik: string;
  total_soal: number;
  durasi_menit: number;
  created_at: string;
}

interface QuestionRow {
  id: string;
  quiz_id: string;
  pertanyaan: string;
  pilihan: string[] | unknown;
  jawaban_benar: number;
  created_at: string;
}

interface ScoreRow {
  id: string;
  murid_id: string;
  quiz_id: string;
  skor: number;
  total_benar: number;
  total_soal: number;
  waktu_pengerjaan_detik: number | null;
  submitted_at: string;
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).map(part => part[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function formatTime(totalSeconds?: number | null) {
  if (!totalSeconds) return "-";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function MuridQuiz() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [questionsByQuiz, setQuestionsByQuiz] = useState<Record<string, QuestionRow[]>>({});
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [leaderboardNames, setLeaderboardNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>({ mode: "list" });

  useEffect(() => {
    fetchQuizData();

    const channel = supabase
      .channel("murid-quiz-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz" }, fetchQuizData)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_questions" }, fetchQuizData)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_scores" }, fetchQuizData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchQuizData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const [{ data: quizData, error: quizError }, { data: questionData, error: questionError }, { data: scoreData, error: scoreError }, { data: usersData }] = await Promise.all([
        supabase.from("quiz").select("*").order("created_at", { ascending: false }),
        supabase.from("quiz_questions").select("*").order("created_at", { ascending: true }),
        supabase.from("quiz_scores").select("*").order("submitted_at", { ascending: false }),
        supabase.from("users").select("id, nama").eq("role", "murid"),
      ]);

      if (quizError) throw quizError;
      if (questionError) throw questionError;
      if (scoreError) throw scoreError;

      const groupedQuestions = (questionData || []).reduce<Record<string, QuestionRow[]>>((acc, question: any) => {
        const pilihan = Array.isArray(question.pilihan) ? question.pilihan : [];
        const normalized = { ...question, pilihan };
        acc[question.quiz_id] = [...(acc[question.quiz_id] || []), normalized];
        return acc;
      }, {});

      setQuizzes(quizData || []);
      setQuestionsByQuiz(groupedQuestions);
      setScores(scoreData || []);
      setLeaderboardNames(Object.fromEntries((usersData || []).map((row: any) => [row.id, row.nama])));
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat quiz");
    } finally {
      setLoading(false);
    }
  };

  const quizDataById = useMemo(() => {
    return Object.fromEntries(quizzes.map(quiz => {
      const quizQuestions = questionsByQuiz[quiz.id] || [];
      const timePerQuestion = Math.max(10, Math.ceil((quiz.durasi_menit * 60) / Math.max(quizQuestions.length, 1)));
      const data: QuizData = {
        id: quiz.id,
        title: quiz.judul,
        subject: quiz.topik,
        timePerQuestion,
        xpReward: Math.max(100, quizQuestions.length * 50),
        questions: quizQuestions.map((question, index) => ({
          id: question.id || `${quiz.id}-${index}`,
          text: question.pertanyaan,
          options: Array.isArray(question.pilihan) ? question.pilihan as string[] : [],
          correctAnswer: question.jawaban_benar,
        })),
      };

      return [quiz.id, data];
    }));
  }, [quizzes, questionsByQuiz]);

  const getBestScore = (quizId: string) => {
    const ownScores = scores.filter(score => score.murid_id === user?.id && score.quiz_id === quizId);
    if (ownScores.length === 0) return null;
    return Math.max(...ownScores.map(score => score.skor));
  };

  const buildLeaderboard = (quizId: string, fallbackScore: number, scoreRows: ScoreRow[] = scores): LeaderboardEntry[] => {
    const bestByStudent = new Map<string, ScoreRow>();

    scoreRows
      .filter(score => score.quiz_id === quizId)
      .forEach(score => {
        const existing = bestByStudent.get(score.murid_id);
        if (!existing || score.skor > existing.skor || (score.skor === existing.skor && (score.waktu_pengerjaan_detik || 999999) < (existing.waktu_pengerjaan_detik || 999999))) {
          bestByStudent.set(score.murid_id, score);
        }
      });

    if (user?.id && !bestByStudent.has(user.id)) {
      bestByStudent.set(user.id, {
        id: "current",
        murid_id: user.id,
        quiz_id: quizId,
        skor: fallbackScore,
        total_benar: 0,
        total_soal: 0,
        waktu_pengerjaan_detik: null,
        submitted_at: new Date().toISOString(),
      });
    }

    return Array.from(bestByStudent.values())
      .sort((a, b) => b.skor - a.skor || (a.waktu_pengerjaan_detik || 999999) - (b.waktu_pengerjaan_detik || 999999))
      .slice(0, 10)
      .map((score, index) => {
        const name = score.murid_id === user?.id ? user.nama : leaderboardNames[score.murid_id] || "Murid";
        return {
          rank: index + 1,
          name,
          score: score.skor,
          time: formatTime(score.waktu_pengerjaan_detik),
          avatar: initials(name),
        };
      });
  };

  const handleStartQuiz = (quizId: string) => {
    const quiz = quizDataById[quizId];
    if (!quiz || quiz.questions.length === 0) {
      toast.error("Quiz belum memiliki soal");
      return;
    }

    setView({ mode: "playing", quizId });
  };

  const handleFinishQuiz = async (quizId: string, answers: number[], timeSpent: number) => {
    if (!user?.id) return;

    const quiz = quizDataById[quizId];
    if (!quiz) return;

    const correct = answers.filter((answer, index) => answer === quiz.questions[index].correctAnswer).length;
    const score = Math.round((correct / quiz.questions.length) * 100);
    const previousBest = getBestScore(quizId) || 0;

    try {
      const { data, error } = await supabase
        .from("quiz_scores")
        .insert({
          murid_id: user.id,
          quiz_id: quizId,
          skor: score,
          total_benar: correct,
          total_soal: quiz.questions.length,
          waktu_pengerjaan_detik: timeSpent,
        })
        .select()
        .single();

      if (error) throw error;

      const improvedScore = Math.max(0, score - previousBest);
      const xpEarned = previousBest === 0
        ? Math.round((score / 100) * quiz.xpReward)
        : Math.round((improvedScore / 100) * quiz.xpReward);

      if (xpEarned > 0) {
        await addStudentXp(user.id, xpEarned);
      }

      const nextScores = data ? [data, ...scores] : scores;
      setScores(nextScores);
      const leaderboard = buildLeaderboard(quizId, score, nextScores);
      setView({ mode: "result", quizId, answers, timeSpent, leaderboard });
      fetchQuizData();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan skor quiz");
    }
  };

  if (view.mode === "playing") {
    const quiz = quizDataById[view.quizId];
    if (!quiz) return null;

    return (
      <div className="space-y-6">
        <QuizPlayer quiz={quiz} onFinish={(answers, time) => handleFinishQuiz(view.quizId, answers, time)} />
      </div>
    );
  }

  if (view.mode === "result") {
    const quiz = quizDataById[view.quizId];
    if (!quiz) return null;

    return (
      <QuizResult
        quiz={quiz}
        answers={view.answers}
        timeSpent={view.timeSpent}
        leaderboard={view.leaderboard}
        userName={user?.nama ?? "Kamu"}
        onBack={() => setView({ mode: "list" })}
        onRetry={() => handleStartQuiz(view.quizId)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Quiz Informatika</h2>
        <p className="text-muted-foreground">Quiz terbaru dari guru, tersinkron langsung dari database</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <p className="text-muted-foreground py-8">Memuat quiz...</p>
        ) : quizzes.length === 0 ? (
          <p className="text-muted-foreground py-8">Belum ada quiz tersedia</p>
        ) : quizzes.map(quiz => {
          const quizQuestions = questionsByQuiz[quiz.id] || [];
          const bestScore = getBestScore(quiz.id);
          const isDone = bestScore !== null;

          return (
            <Card key={quiz.id} className="p-5 shadow-card border-0 hover:shadow-elevated transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isDone ? "gradient-xp" : "gradient-badge"}`}>
                    {isDone ? <CheckCircle className="h-5 w-5 text-primary-foreground" /> :
                     <ClipboardList className="h-5 w-5 text-primary-foreground" />}
                  </div>
                  <div>
                    <h3 className="font-semibold">{quiz.judul}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{quizQuestions.length} soal</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{quiz.durasi_menit} min</span>
                      <span className="flex items-center gap-1"><Star className="h-3 w-3" />+{Math.max(100, quizQuestions.length * 50)} XP</span>
                    </div>
                    {quiz.deskripsi && <p className="text-xs text-muted-foreground mt-2">{quiz.deskripsi}</p>}
                  </div>
                </div>
              </div>
              {isDone ? (
                <div className="flex items-center justify-between">
                  <Badge className="gradient-xp text-xp-foreground border-0">Skor terbaik: {bestScore}%</Badge>
                  <Button variant="outline" size="sm" onClick={() => handleStartQuiz(quiz.id)}>Ulangi</Button>
                </div>
              ) : (
                <Button className="w-full gradient-primary text-primary-foreground" onClick={() => handleStartQuiz(quiz.id)}>
                  <Play className="mr-2 h-4 w-4" /> Mulai Quiz
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
