import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Star, Clock, CheckCircle, XCircle, ArrowLeft, RotateCcw, Medal } from "lucide-react";
import type { QuizData, LeaderboardEntry } from "@/data/quizData";

interface QuizResultProps {
  quiz: QuizData;
  answers: number[];
  timeSpent: number;
  leaderboard: LeaderboardEntry[];
  userName: string;
  onBack: () => void;
  onRetry: () => void;
}

export default function QuizResult({ quiz, answers, timeSpent, leaderboard, userName, onBack, onRetry }: QuizResultProps) {
  const correct = answers.filter((a, i) => a === quiz.questions[i].correctAnswer).length;
  const score = Math.round((correct / quiz.questions.length) * 100);
  const xpEarned = Math.round((score / 100) * quiz.xpReward);
  const minutes = Math.floor(timeSpent / 60);
  const seconds = timeSpent % 60;
  const userRank = leaderboard.find(e => e.name === userName)?.rank ?? 0;

  const getGrade = () => {
    if (score >= 90) return { label: "Luar Biasa! 🏆", color: "text-yellow-500" };
    if (score >= 75) return { label: "Hebat! 🌟", color: "text-primary" };
    if (score >= 60) return { label: "Bagus! 👍", color: "text-blue-500" };
    return { label: "Tetap Semangat! 💪", color: "text-muted-foreground" };
  };

  const grade = getGrade();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Score Summary */}
      <Card className="p-6 shadow-card border-0 text-center">
        <div className="mb-4">
          <Trophy className={`h-12 w-12 mx-auto mb-2 ${score >= 75 ? "text-yellow-500" : "text-muted-foreground"}`} />
          <h2 className="text-2xl font-display font-bold">{quiz.title}</h2>
          <p className={`text-lg font-semibold mt-1 ${grade.color}`}>{grade.label}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
          <div className="p-3 rounded-xl bg-muted">
            <p className={`text-3xl font-bold ${score < 75 ? 'text-destructive' : 'text-primary'}`}>{score}%</p>
            <p className="text-xs text-muted-foreground">Skor</p>
          </div>
          <div className="p-3 rounded-xl bg-muted">
            <p className="text-3xl font-bold">{correct}/{quiz.questions.length}</p>
            <p className="text-xs text-muted-foreground">Benar</p>
          </div>
          <div className="p-3 rounded-xl bg-muted">
            <div className="flex items-center justify-center gap-1">
              <Star className="h-5 w-5 text-yellow-500" />
              <p className="text-3xl font-bold text-yellow-600">+{xpEarned}</p>
            </div>
            <p className="text-xs text-muted-foreground">XP Diperoleh</p>
          </div>
          <div className="p-3 rounded-xl bg-muted">
            <div className="flex items-center justify-center gap-1">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <p className="text-3xl font-bold">{minutes}:{seconds.toString().padStart(2, "0")}</p>
            </div>
            <p className="text-xs text-muted-foreground">Waktu</p>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
          <Button onClick={onBack} className="gradient-primary text-primary-foreground">
            <CheckCircle className="mr-2 h-4 w-4" /> Selesai
          </Button>
          <Button variant="outline" onClick={onRetry}>
            <RotateCcw className="mr-2 h-4 w-4" /> Ulangi Quiz
          </Button>
        </div>
      </Card>

      {/* Leaderboard */}
      <Card className="p-6 shadow-card border-0">
        <div className="flex items-center gap-2 mb-4">
          <Medal className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-display font-bold">Peringkat Kelas</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead className="text-right">Skor</TableHead>
              <TableHead className="text-right">Waktu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard.map(entry => (
              <TableRow
                key={entry.rank}
                className={entry.name === userName ? "bg-primary/5 font-semibold" : ""}
              >
                <TableCell>
                  {entry.rank <= 3 ? (
                    <span className={`text-lg ${entry.rank === 1 ? "text-yellow-500" : entry.rank === 2 ? "text-gray-400" : "text-amber-600"}`}>
                      {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
                    </span>
                  ) : entry.rank}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {entry.avatar}
                    </div>
                    {entry.name}
                    {entry.name === userName && <Badge variant="secondary" className="text-xs">Kamu</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">{entry.score}%</TableCell>
                <TableCell className="text-right">{entry.time}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {userRank > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Peringkatmu: <span className="font-bold text-primary">#{userRank}</span> dari {leaderboard.length} siswa
          </p>
        )}
      </Card>

      {/* Answer Review */}
      <Card className="p-6 shadow-card border-0">
        <h3 className="text-lg font-display font-bold mb-4">Pembahasan Jawaban</h3>
        <div className="space-y-4">
          {quiz.questions.map((q, i) => {
            const isCorrect = answers[i] === q.correctAnswer;
            const wasAnswered = answers[i] !== -1;
            return (
              <div key={q.id} className={`p-4 rounded-xl border-2 ${isCorrect ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}`}>
                <div className="flex items-start gap-2 mb-2">
                  {isCorrect ? <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" /> : <XCircle className="h-5 w-5 text-red-500 mt-0.5" />}
                  <div>
                    <p className="font-medium text-sm">Soal {i + 1}: {q.text}</p>
                    {wasAnswered && !isCorrect && (
                      <p className="text-sm text-red-500 mt-1">Jawabanmu: {q.options[answers[i]]}</p>
                    )}
                    {!wasAnswered && (
                      <p className="text-sm text-muted-foreground mt-1">Tidak dijawab</p>
                    )}
                    <p className="text-sm text-green-700 mt-1">Jawaban benar: {q.options[q.correctAnswer]}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
