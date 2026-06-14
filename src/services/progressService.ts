import { supabase } from "@/integrations/supabase/client";

export interface StudentProgress {
  id: string;
  murid_id: string;
  materi_id: string;
  status: "belum" | "sedang" | "selesai";
  progres_persen: number;
  last_accessed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Get progress by murid
export async function getProgressByMurid(muridId: string) {
  try {
    const { data, error } = await supabase
      .from("student_progress")
      .select("*")
      .eq("murid_id", muridId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data as StudentProgress[];
  } catch (err) {
    throw err;
  }
}

// Get progress by materi
export async function getProgressByMateri(materiId: string) {
  try {
    const { data, error } = await supabase
      .from("student_progress")
      .select("*")
      .eq("materi_id", materiId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data as StudentProgress[];
  } catch (err) {
    throw err;
  }
}

// Get progress by murid and materi
export async function getProgressByMuridAndMateri(muridId: string, materiId: string) {
  try {
    const { data, error } = await supabase
      .from("student_progress")
      .select("*")
      .eq("murid_id", muridId)
      .eq("materi_id", materiId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found, which is expected
      throw new Error(error.message);
    }

    return data as StudentProgress | null;
  } catch (err) {
    throw err;
  }
}

// Create progress
export async function createProgress(muridId: string, materiId: string, status: "belum" | "sedang" | "selesai" = "belum") {
  try {
    const { data, error } = await supabase
      .from("student_progress")
      .insert([{ murid_id: muridId, materi_id: materiId, status, progres_persen: 0 }])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as StudentProgress;
  } catch (err) {
    throw err;
  }
}

// Update progress
export async function updateProgress(
  id: string,
  status: "belum" | "sedang" | "selesai",
  progresPersen: number
) {
  try {
    const { data, error } = await supabase
      .from("student_progress")
      .update({
        status,
        progres_persen: progresPersen,
        last_accessed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as StudentProgress;
  } catch (err) {
    throw err;
  }
}

// Update progress by murid and materi
export async function updateProgressByMuridAndMateri(
  muridId: string,
  materiId: string,
  status: "belum" | "sedang" | "selesai",
  progresPersen: number
) {
  try {
    // Check if progress exists
    const existing = await getProgressByMuridAndMateri(muridId, materiId);

    if (existing) {
      // Update existing
      return await updateProgress(existing.id, status, progresPersen);
    } else {
      // Create new
      const newProgress = await createProgress(muridId, materiId, status);
      return await updateProgress(newProgress.id, status, progresPersen);
    }
  } catch (err) {
    throw err;
  }
}

// Delete progress
export async function deleteProgress(id: string) {
  try {
    const { error } = await supabase
      .from("student_progress")
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

// Get learning stats for murid
export async function getMuridStats(muridId: string) {
  try {
    const { data, error } = await supabase
      .from("student_progress")
      .select("status, progres_persen")
      .eq("murid_id", muridId);

    if (error) {
      throw new Error(error.message);
    }

    const stats = {
      totalMateri: data.length,
      selesai: data.filter((p) => p.status === "selesai").length,
      sedang: data.filter((p) => p.status === "sedang").length,
      belum: data.filter((p) => p.status === "belum").length,
      rataRataProgres: Math.round(
        data.reduce((sum, p) => sum + (p.progres_persen || 0), 0) / data.length || 0
      ),
    };

    return stats;
  } catch (err) {
    throw err;
  }
}
