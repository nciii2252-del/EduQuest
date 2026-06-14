import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "guru" | "murid";

export interface StudentLeaderboardEntry {
  murid_id: string;
  nama: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
  avgScore: number;
  materiProgress: number;
  quizDone: number;
  materiDone: number;
  rank: number;
}

export interface ActivityItem {
  text: string;
  time: string;
  type: string;
  createdAt: string;
}

export interface StudentStats {
  xp: number;
  level: number;
  streak: number;
  xpToNext: number;
  xpProgress: number;
  materiSelesai: number;
  totalMateri: number;
  quizSelesai: number;
  totalQuiz: number;
  peringkat: number;
  totalProgress: number;
  avgScore: number;
  topics: Array<{
    name: string;
    progress: number;
    quizAvg: number;
    materials: string;
    achieved: boolean;
  }>;
}

export interface StudentBadges {
  quizMaster: boolean;
  onFire: boolean;
  bintangKelas: boolean;
  kutuBuku: boolean;
  roketBelajar: boolean;
  legendaris: boolean;
}

const LEVEL_STEP = 500;

function isMissingLearningColumn(error: unknown) {
  const message = error instanceof Error ? error.message : String((error as any)?.message || error || "");
  return message.includes("users.xp") ||
    message.includes("users.level") ||
    message.includes("users.streak") ||
    message.includes("column") && (message.includes("xp") || message.includes("level") || message.includes("streak")) ||
    message.includes("PGRST204");
}

function withDefaultLearningStats<T extends { xp?: number; level?: number; streak?: number }>(user: T) {
  const xp = user.xp ?? 0;
  return {
    ...user,
    xp,
    level: user.level ?? levelFromXp(xp),
    streak: user.streak ?? 0,
  };
}

export async function getUsersWithLearningStats(role?: AppRole) {
  const applyRole = (query: any) => role ? query.eq("role", role) : query;
  const fullQuery = applyRole(supabase.from("users").select("id, nama, email, role, xp, level, streak, created_at, updated_at"));
  const { data, error } = await fullQuery.order("created_at", { ascending: false });

  if (!error) return (data || []).map((user: any) => withDefaultLearningStats(user));
  if (!isMissingLearningColumn(error)) throw new Error(error.message);

  const fallbackQuery = applyRole(supabase.from("users").select("id, nama, email, role, created_at, updated_at"));
  const { data: fallbackData, error: fallbackError } = await fallbackQuery.order("created_at", { ascending: false });

  if (fallbackError) throw new Error(fallbackError.message);
  return (fallbackData || []).map((user: any) => withDefaultLearningStats(user));
}

export async function getUserLearningStats(userId: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id, xp, level, streak")
    .eq("id", userId)
    .single();

  if (!error) return withDefaultLearningStats(data as any);
  if (!isMissingLearningColumn(error)) throw new Error(error.message);

  const { data: fallbackData, error: fallbackError } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();

  if (fallbackError) throw new Error(fallbackError.message);
  return withDefaultLearningStats(fallbackData as any);
}

export async function addStudentXp(userId: string, amount: number) {
  if (amount <= 0) return { applied: false, xp: 0, level: 1 };

  try {
    const current = await getUserLearningStats(userId);
    const nextXp = (current.xp || 0) + amount;
    const nextLevel = levelFromXp(nextXp);
    const { error } = await supabase
      .from("users")
      .update({ xp: nextXp, level: nextLevel, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      if (isMissingLearningColumn(error)) return { applied: false, xp: current.xp || 0, level: current.level || 1 };
      throw new Error(error.message);
    }

    return { applied: true, xp: nextXp, level: nextLevel };
  } catch (error) {
    if (isMissingLearningColumn(error)) return { applied: false, xp: 0, level: 1 };
    throw error;
  }
}

export function levelFromXp(xp: number) {
  return Math.max(1, Math.floor(Math.max(0, xp) / LEVEL_STEP) + 1);
}

export function nextLevelXp(level: number) {
  return Math.max(1, level) * LEVEL_STEP;
}

export function formatRelativeTime(value?: string | null) {
  if (!value) return "-";

  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));

  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

function bestScoresByQuiz(scores: Array<{ quiz_id: string; skor: number }>) {
  const best = new Map<string, number>();
  scores.forEach((score) => {
    best.set(score.quiz_id, Math.max(best.get(score.quiz_id) ?? 0, score.skor || 0));
  });
  return best;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export async function getStudentLeaderboard() {
  const [users, { data: scores, error: scoresError }, { data: progress, error: progressError }] =
    await Promise.all([
      getUsersWithLearningStats("murid"),
      supabase.from("quiz_scores").select("murid_id, quiz_id, skor"),
      supabase.from("student_progress").select("murid_id, materi_id, progres_persen"),
    ]);

  if (scoresError) throw new Error(scoresError.message);
  if (progressError) throw new Error(progressError.message);

  const entries = (users || []).map((student: any) => {
    const studentScores = (scores || []).filter((score: any) => score.murid_id === student.id);
    const bestScores = [...bestScoresByQuiz(studentScores).values()];
    const studentProgress = (progress || []).filter((item: any) => item.murid_id === student.id);
    const xp = student.xp ?? 0;

    return {
      murid_id: student.id,
      nama: student.nama,
      email: student.email,
      xp,
      level: student.level ?? levelFromXp(xp),
      streak: student.streak ?? 0,
      avgScore: average(bestScores),
      materiProgress: average(studentProgress.map((item: any) => item.progres_persen || 0)),
      quizDone: bestScores.length,
      materiDone: studentProgress.filter((item: any) => (item.progres_persen || 0) >= 100).length,
      rank: 0,
    };
  });

  return entries
    .sort((a, b) =>
      b.xp - a.xp ||
      b.materiProgress - a.materiProgress ||
      b.avgScore - a.avgScore ||
      b.quizDone - a.quizDone ||
      a.nama.localeCompare(b.nama)
    )
    .map((entry, index) => ({ ...entry, rank: index + 1 })) as StudentLeaderboardEntry[];
}

export async function getStudentStats(muridId: string) {
  const [
    userRows,
    { data: materials, error: materialError },
    { data: quizzes, error: quizError },
    { data: progressRows, error: progressError },
    { data: scores, error: scoreError },
    leaderboard,
  ] = await Promise.all([
    getUserLearningStats(muridId),
    supabase.from("materi").select("id, topik, status").eq("status", "published"),
    supabase.from("quiz").select("id, topik"),
    supabase.from("student_progress").select("materi_id, progres_persen").eq("murid_id", muridId),
    supabase.from("quiz_scores").select("quiz_id, skor").eq("murid_id", muridId),
    getStudentLeaderboard(),
  ]);

  if (materialError) throw new Error(materialError.message);
  if (quizError) throw new Error(quizError.message);
  if (progressError) throw new Error(progressError.message);
  if (scoreError) throw new Error(scoreError.message);

  const progressByMaterial = new Map((progressRows || []).map((item: any) => [item.materi_id, item.progres_persen || 0]));
  const bestByQuiz = bestScoresByQuiz(scores || []);
  const topicNames = [...new Set([...(materials || []).map((m: any) => m.topik), ...(quizzes || []).map((q: any) => q.topik)])];
  const xp = (userRows as any)?.xp ?? 0;
  const level = (userRows as any)?.level ?? levelFromXp(xp);
  const xpTarget = nextLevelXp(level);

  const topics = topicNames.map((name) => {
    const topicMaterials = (materials || []).filter((m: any) => m.topik === name);
    const topicQuizzes = (quizzes || []).filter((q: any) => q.topik === name);
    const materialProgress = topicMaterials.map((m: any) => progressByMaterial.get(m.id) ?? 0);
    const quizScores = topicQuizzes.map((q: any) => bestByQuiz.get(q.id) ?? 0).filter((score) => score > 0);
    const openedMaterials = topicMaterials.length > 0 && materialProgress.every((value) => value > 0);
    const didQuiz = topicQuizzes.length > 0 && quizScores.length > 0;

    return {
      name,
      progress: average(materialProgress),
      quizAvg: average(quizScores),
      materials: `${materialProgress.filter((value) => value >= 100).length}/${topicMaterials.length}`,
      achieved: openedMaterials && didQuiz,
    };
  });

  const totalMateri = materials?.length || 0;
  const materiSelesai = (materials || []).filter((m: any) => (progressByMaterial.get(m.id) ?? 0) >= 100).length;
  const quizSelesai = bestByQuiz.size;
  const rank = leaderboard.find((entry) => entry.murid_id === muridId)?.rank || leaderboard.length || 0;

  return {
    xp,
    level,
    streak: (userRows as any)?.streak ?? 0,
    xpToNext: xpTarget,
    xpProgress: Math.min(100, Math.round((xp / xpTarget) * 100)),
    materiSelesai,
    totalMateri,
    quizSelesai,
    totalQuiz: quizzes?.length || 0,
    peringkat: rank,
    totalProgress: average((materials || []).map((m: any) => progressByMaterial.get(m.id) ?? 0)),
    avgScore: average([...bestByQuiz.values()]),
    topics,
  } as StudentStats;
}

export async function getStudentBadges(muridId: string) {
  const [stats, leaderboard, { data: quizzes }, { data: scores }] = await Promise.all([
    getStudentStats(muridId),
    getStudentLeaderboard(),
    supabase.from("quiz").select("id"),
    supabase.from("quiz_scores").select("quiz_id, skor").eq("murid_id", muridId),
  ]);

  const bestByQuiz = bestScoresByQuiz(scores || []);
  const quizMaster = (quizzes?.length || 0) > 0 && (quizzes || []).every((quiz: any) => (bestByQuiz.get(quiz.id) ?? 0) >= 80);
  const onFire = stats.streak >= 2;
  const bintangKelas = (leaderboard.find((entry) => entry.murid_id === muridId)?.rank || 999) <= 3;
  const kutuBuku = stats.totalMateri > 0 && stats.materiSelesai === stats.totalMateri;
  const roketBelajar = stats.xp >= 1000 || stats.level >= 3;
  const legendaris = quizMaster && onFire && bintangKelas && kutuBuku && roketBelajar;

  return { quizMaster, onFire, bintangKelas, kutuBuku, roketBelajar, legendaris } as StudentBadges;
}

export async function getRecentActivities(limit = 6) {
  const [{ data: scores }, { data: progress }, { data: users }, { data: materials }] = await Promise.all([
    supabase
      .from("quiz_scores")
      .select("id, skor, submitted_at, users!quiz_scores_murid_id_fkey(nama), quiz(judul)")
      .order("submitted_at", { ascending: false })
      .limit(limit),
    supabase
      .from("student_progress")
      .select("id, progres_persen, updated_at, users!student_progress_murid_id_fkey(nama), materi(judul)")
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase.from("users").select("id, nama, role, created_at").order("created_at", { ascending: false }).limit(limit),
    supabase.from("materi").select("id, judul, updated_at").order("updated_at", { ascending: false }).limit(limit),
  ]);

  const items: ActivityItem[] = [
    ...(scores || []).map((row: any) => ({
      text: `${row.users?.nama || "Murid"} mendapat skor ${row.skor}% di ${row.quiz?.judul || "quiz"}`,
      time: formatRelativeTime(row.submitted_at),
      type: "score",
      createdAt: row.submitted_at,
    })),
    ...(progress || []).map((row: any) => ({
      text: `${row.users?.nama || "Murid"} memperbarui progres ${row.materi?.judul || "materi"} menjadi ${row.progres_persen}%`,
      time: formatRelativeTime(row.updated_at),
      type: "materi",
      createdAt: row.updated_at,
    })),
    ...(users || []).map((row: any) => ({
      text: `${row.nama} bergabung sebagai ${row.role}`,
      time: formatRelativeTime(row.created_at),
      type: row.role,
      createdAt: row.created_at,
    })),
    ...(materials || []).map((row: any) => ({
      text: `Materi "${row.judul}" diperbarui`,
      time: formatRelativeTime(row.updated_at),
      type: "materi",
      createdAt: row.updated_at,
    })),
  ];

  return items
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export async function getPlatformStats() {
  const [
    { data: users, error: usersError },
    { data: materials, error: materialsError },
    { data: quizzes, error: quizzesError },
    { data: scores, error: scoresError },
    { data: progress, error: progressError },
  ] = await Promise.all([
    supabase.from("users").select("id, role, created_at"),
    supabase.from("materi").select("id, status, created_at"),
    supabase.from("quiz").select("id, created_at"),
    supabase.from("quiz_scores").select("skor, submitted_at"),
    supabase.from("student_progress").select("murid_id, progres_persen, updated_at"),
  ]);

  if (usersError) throw new Error(usersError.message);
  if (materialsError) throw new Error(materialsError.message);
  if (quizzesError) throw new Error(quizzesError.message);
  if (scoresError) throw new Error(scoresError.message);
  if (progressError) throw new Error(progressError.message);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return {
    totalUsers: users?.length || 0,
    totalGuru: (users || []).filter((user: any) => user.role === "guru").length,
    totalMurid: (users || []).filter((user: any) => user.role === "murid").length,
    totalMateri: materials?.length || 0,
    totalQuiz: quizzes?.length || 0,
    avgScore: average((scores || []).map((score: any) => score.skor || 0)),
    activeStudents: new Set((progress || []).filter((row: any) => new Date(row.updated_at).getTime() >= weekAgo).map((row: any) => row.murid_id)).size,
    completedMaterialsThisWeek: (progress || []).filter((row: any) => (row.progres_persen || 0) >= 100 && new Date(row.updated_at).getTime() >= weekAgo).length,
    quizSubmissionsThisWeek: (scores || []).filter((row: any) => new Date(row.submitted_at).getTime() >= weekAgo).length,
  };
}
