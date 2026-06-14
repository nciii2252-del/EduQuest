import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Clock, ChevronRight, AlertTriangle } from "lucide-react";
import type { QuizData } from "@/data/quizData";

interface QuizPlayerProps {
  quiz: QuizData;
  onFinish: (answers: number[], timeSpent: number) => void;
}

export default function QuizPlayer({ quiz, onFinish }: QuizPlayerProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(quiz.questions.length).fill(-1));
  const [timeLeft, setTimeLeft] = useState(quiz.timePerQuestion);
  const [totalTime, setTotalTime] = useState(0);
  const [selected, setSelected] = useState<string>("");

  const question = quiz.questions[currentQ];
  const isLast = currentQ === quiz.questions.length - 1;
  const progress = ((currentQ + 1) / quiz.questions.length) * 100;

  const goNext = useCallback(() => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = selected ? parseInt(selected) : -1;
    setAnswers(newAnswers);

    if (isLast) {
      onFinish(newAnswers, totalTime + (quiz.timePerQuestion - timeLeft));
    } else {
      setCurrentQ(prev => prev + 1);
      setTimeLeft(quiz.timePerQuestion);
      setSelected("");
    }
  }, [answers, currentQ, selected, isLast, onFinish, totalTime, timeLeft, quiz.timePerQuestion]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          goNext();
          return quiz.timePerQuestion;
        }
        return prev - 1;
      });
      setTotalTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentQ, goNext, quiz.timePerQuestion]);

  const timePercent = (timeLeft / quiz.timePerQuestion) * 100;
  const isLowTime = timeLeft <= 5;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold">{quiz.title}</h2>
          <p className="text-sm text-muted-foreground">{quiz.subject}</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          Soal {currentQ + 1}/{quiz.questions.length}
        </Badge>
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-2" />

      {/* Timer */}
      <div className={`flex items-center gap-2 p-3 rounded-lg ${isLowTime ? "bg-destructive/10 animate-pulse" : "bg-muted"}`}>
        {isLowTime ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <Clock className="h-5 w-5 text-muted-foreground" />}
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1">
            <span className={isLowTime ? "text-destructive font-bold" : "text-muted-foreground"}>
              {isLowTime ? "Waktu hampir habis!" : "Sisa waktu"}
            </span>
            <span className={`font-mono font-bold ${isLowTime ? "text-destructive" : ""}`}>{timeLeft}s</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-1000 ${isLowTime ? "bg-destructive" : "bg-primary"}`}
              style={{ width: `${timePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Card */}
      <Card className="p-6 shadow-card border-0">
        <h3 className="text-lg font-semibold mb-6">{question.text}</h3>

        <RadioGroup value={selected} onValueChange={setSelected} className="space-y-3">
          {question.options.map((opt, i) => (
            <Label
              key={i}
              htmlFor={`opt-${i}`}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selected === String(i)
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/30 hover:bg-muted/50"
              }`}
            >
              <RadioGroupItem value={String(i)} id={`opt-${i}`} />
              <span className="font-medium text-sm">{String.fromCharCode(65 + i)}.</span>
              <span>{opt}</span>
            </Label>
          ))}
        </RadioGroup>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground self-center">
          {answers.filter(a => a !== -1).length} dari {quiz.questions.length} terjawab
        </p>
        <Button
          onClick={goNext}
          className="gradient-primary text-primary-foreground px-6"
        >
          {isLast ? "Selesai" : "Selanjutnya"}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
