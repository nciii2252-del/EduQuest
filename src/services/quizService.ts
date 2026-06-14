import { supabase } from "@/integrations/supabase/client";

export interface Quiz {
  id: string;
  guru_id: string;
  judul: string;
  deskripsi: string | null;
  topik: string;
  total_soal: number;
  durasi_menit: number;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  pertanyaan: string;
  pilihan: string[];
  jawaban_benar: number;
  created_at: string;
}

// Get all quiz
export async function getAllQuiz() {
  try {
    const { data, error } = await supabase
      .from("quiz")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data as Quiz[];
  } catch (err) {
    throw err;
  }
}

// Get quiz by ID
export async function getQuizById(id: string) {
  try {
    const { data, error } = await supabase
      .from("quiz")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Quiz;
  } catch (err) {
    throw err;
  }
}

// Get quiz by guru ID
export async function getQuizByGuru(guruId: string) {
  try {
    const { data, error } = await supabase
      .from("quiz")
      .select("*")
      .eq("guru_id", guruId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data as Quiz[];
  } catch (err) {
    throw err;
  }
}

// Get quiz by topik
export async function getQuizByTopic(topik: string) {
  try {
    const { data, error } = await supabase
      .from("quiz")
      .select("*")
      .eq("topik", topik)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data as Quiz[];
  } catch (err) {
    throw err;
  }
}

// Create quiz baru
export async function createQuiz(
  guruId: string,
  judul: string,
  deskripsi: string,
  topik: string,
  totalSoal: number,
  durasiMenit: number = 30
) {
  try {
    const { data, error } = await supabase
      .from("quiz")
      .insert([
        {
          guru_id: guruId,
          judul,
          deskripsi,
          topik,
          total_soal: totalSoal,
          durasi_menit: durasiMenit,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Quiz;
  } catch (err) {
    throw err;
  }
}

// Update quiz
export async function updateQuiz(id: string, updates: Partial<Quiz>) {
  try {
    const { data, error } = await supabase
      .from("quiz")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Quiz;
  } catch (err) {
    throw err;
  }
}

// Delete quiz
export async function deleteQuiz(id: string) {
  try {
    const { error } = await supabase
      .from("quiz")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  } catch (err) {
    throw err;
  }
}

// ==================== QUIZ QUESTIONS ====================

// Get all questions by quiz ID
export async function getQuizQuestions(quizId: string) {
  try {
    const { data, error } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data as QuizQuestion[];
  } catch (err) {
    throw err;
  }
}

// Get question by ID
export async function getQuestionById(id: string) {
  try {
    const { data, error } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as QuizQuestion;
  } catch (err) {
    throw err;
  }
}

// Create question
export async function createQuestion(
  quizId: string,
  pertanyaan: string,
  pilihan: string[],
  jawabanBenar: number
) {
  try {
    const { data, error } = await supabase
      .from("quiz_questions")
      .insert([
        {
          quiz_id: quizId,
          pertanyaan,
          pilihan,
          jawaban_benar: jawabanBenar,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as QuizQuestion;
  } catch (err) {
    throw err;
  }
}

// Update question
export async function updateQuestion(
  id: string,
  pertanyaan: string,
  pilihan: string[],
  jawabanBenar: number
) {
  try {
    const { data, error } = await supabase
      .from("quiz_questions")
      .update({ pertanyaan, pilihan, jawaban_benar: jawabanBenar })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as QuizQuestion;
  } catch (err) {
    throw err;
  }
}

// Delete question
export async function deleteQuestion(id: string) {
  try {
    const { error } = await supabase
      .from("quiz_questions")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  } catch (err) {
    throw err;
  }
}

// Delete all questions in quiz
export async function deleteQuizAllQuestions(quizId: string) {
  try {
    const { error } = await supabase
      .from("quiz_questions")
      .delete()
      .eq("quiz_id", quizId);

    if (error) {
      throw new Error(error.message);
    }

    return true;
  } catch (err) {
    throw err;
  }
}
