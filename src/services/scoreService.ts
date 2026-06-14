import { supabase } from "@/integrations/supabase/client";

export interface QuizScore {
  id: string;
  murid_id: string;
  quiz_id: string;
  skor: number;
  total_benar: number;
  total_soal: number;
  waktu_pengerjaan_detik: number | null;
  submitted_at: string;
}

// Get all scores by murid
export async function getScoresByMurid(muridId: string) {
  try {
    const { data, error } = await supabase
      .from("quiz_scores")
      .select("*")
      .eq("murid_id", muridId)
      .order("submitted_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data as QuizScore[];
  } catch (err) {
    throw err;
  }
}

// Get scores by quiz
export async function getScoresByQuiz(quizId: string) {
  try {
    const { data, error } = await supabase
      .from("quiz_scores")
      .select("*")
      .eq("quiz_id", quizId)
      .order("submitted_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data as QuizScore[];
  } catch (err) {
    throw err;
  }
}

// Get score by murid and quiz (latest)
export async function getScoreByMuridAndQuiz(muridId: string, quizId: string) {
  try {
    const { data, error } = await supabase
      .from("quiz_scores")
      .select("*")
      .eq("murid_id", muridId)
      .eq("quiz_id", quizId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(error.message);
    }

    return data as QuizScore | null;
  } catch (err) {
    throw err;
  }
}

// Create score (submit quiz)
export async function submitQuizScore(
  muridId: string,
  quizId: string,
  totalBenar: number,
  totalSoal: number,
  waktuPengerjaan?: number
) {
  try {
    // Calculate score (percentage)
    const skor = Math.round((totalBenar / totalSoal) * 100);

    const { data, error } = await supabase
      .from("quiz_scores")
      .insert([
        {
          murid_id: muridId,
          quiz_id: quizId,
          skor,
          total_benar: totalBenar,
          total_soal: totalSoal,
          waktu_pengerjaan_detik: waktuPengerjaan || null,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as QuizScore;
  } catch (err) {
    throw err;
  }
}

// Get leaderboard for quiz
export async function getQuizLeaderboard(quizId: string, limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from("quiz_scores")
      .select("*, users(nama)")
      .eq("quiz_id", quizId)
      .order("skor", { ascending: false })
      .order("submitted_at", { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return data as (QuizScore & { users: { nama: string } })[];
  } catch (err) {
    throw err;
  }
}

// Get murid leaderboard (all scores average)
export async function getMuridLeaderboard(limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from("quiz_scores")
      .select("murid_id, skor, users(nama)")
      .order("skor", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // Group by murid and calculate average
    const grouped: { [key: string]: { nama: string; scores: number[] } } = {};

    data.forEach((item: any) => {
      if (!grouped[item.murid_id]) {
        grouped[item.murid_id] = {
          nama: item.users?.nama || "Unknown",
          scores: [],
        };
      }
      grouped[item.murid_id].scores.push(item.skor);
    });

    const leaderboard = Object.entries(grouped)
      .map(([muridId, { nama, scores }]) => ({
        murid_id: muridId,
        nama,
        rata_rata_skor: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        total_quiz_selesai: scores.length,
      }))
      .sort((a, b) => b.rata_rata_skor - a.rata_rata_skor)
      .slice(0, limit);

    return leaderboard;
  } catch (err) {
    throw err;
  }
}

// Get all scores by murid with pagination
export async function getScoresByMuridPaginated(muridId: string, page: number = 1, pageSize: number = 10) {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("quiz_scores")
      .select("*", { count: "exact" })
      .eq("murid_id", muridId)
      .order("submitted_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    return { scores: data as QuizScore[], total: count || 0 };
  } catch (err) {
    throw err;
  }
}
