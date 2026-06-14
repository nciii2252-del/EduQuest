import { supabase } from "@/integrations/supabase/client";

export interface Materi {
  id: string;
  guru_id: string;
  judul: string;
  deskripsi: string | null;
  konten: string | null;
  topik: string;
  status: "published" | "draft";
  file_url: string | null;
  file_name: string | null;
  file_path: string | null;
  created_at: string;
  updated_at: string;
  users?: {
    nama: string;
  } | null;
}

export interface MateriInput {
  guru_id: string;
  judul: string;
  deskripsi?: string | null;
  konten?: string | null;
  topik: string;
  status?: "published" | "draft";
  file_url?: string | null;
  file_name?: string | null;
  file_path?: string | null;
}

export function getMateriFileUrl(materi: Pick<Materi, "file_url" | "file_path">) {
  if (materi.file_url) return materi.file_url;
  if (!materi.file_path) return null;

  const { data } = supabase.storage
    .from("materi_files")
    .getPublicUrl(materi.file_path);

  return data.publicUrl;
}

function isMissingColumnError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  return message.includes("schema cache") || message.includes("column") || message.includes("PGRST204");
}

function serializeLegacyKonten(konten?: string | null, file?: Partial<Pick<Materi, "file_url" | "file_name" | "file_path">>) {
  const base = konten || "";
  if (!file?.file_url && !file?.file_path && !file?.file_name) return base;

  return `${base}\n\n<!--MATERI_FILE:${JSON.stringify({
    url: file.file_url || "",
    name: file.file_name || "",
    path: file.file_path || "",
  })}-->`;
}

export function parseLegacyFile(konten?: string | null) {
  const match = konten?.match(/<!--MATERI_FILE:(.*?)-->/s);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1]);
    return {
      file_url: parsed.url || null,
      file_name: parsed.name || null,
      file_path: parsed.path || null,
    };
  } catch {
    return null;
  }
}

export function getMateriContent(materi: Pick<Materi, "konten">) {
  return (materi.konten || "").replace(/\n?\n?<!--MATERI_FILE:.*?-->/s, "").trim();
}

export function normalizeMateri(materi: Materi): Materi {
  const legacyFile = parseLegacyFile(materi.konten);

  return {
    ...materi,
    konten: getMateriContent(materi),
    status: (materi.status || "published") as "published" | "draft",
    file_url: materi.file_url || legacyFile?.file_url || null,
    file_name: materi.file_name || legacyFile?.file_name || null,
    file_path: materi.file_path || legacyFile?.file_path || null,
  };
}

function normalizeMateriList(data: Materi[] | null) {
  return (data || []).map(normalizeMateri);
}

export async function uploadMateriFile(file: File, userId: string, title: string) {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File terlalu besar. Maksimal 10MB");
  }

  const fileExt = file.name.split(".").pop();
  const safeTitle = title.trim().replace(/[^a-zA-Z0-9-_]+/g, "_").slice(0, 60) || "materi";
  const fileName = `${Date.now()}_${safeTitle}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from("materi_files")
    .upload(filePath, file, { upsert: true });

  if (error) {
    throw new Error(error.message);
  }

  const { data: publicData } = supabase.storage
    .from("materi_files")
    .getPublicUrl(data.path);

  return {
    file_url: publicData.publicUrl,
    file_name: file.name,
    file_path: data.path,
  };
}

// Get all materi
export async function getAllMateri() {
  try {
    const { data, error } = await supabase
      .from("materi")
      .select("*, users!materi_guru_id_fkey(nama)")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return normalizeMateriList(data as Materi[]);
  } catch (err) {
    throw err;
  }
}

// Get materi by ID
export async function getMaterialById(id: string) {
  try {
    const { data, error } = await supabase
      .from("materi")
      .select("*, users!materi_guru_id_fkey(nama)")
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return normalizeMateri(data as Materi);
  } catch (err) {
    throw err;
  }
}

// Get materi by guru ID
export async function getMaterialByGuru(guruId: string) {
  try {
    const { data, error } = await supabase
      .from("materi")
      .select("*, users!materi_guru_id_fkey(nama)")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return normalizeMateriList(data as Materi[]).filter((materi) => materi.guru_id === guruId);
  } catch (err) {
    throw err;
  }
}

// Get materi by topik
export async function getMaterialByTopic(topik: string) {
  try {
    const { data, error } = await supabase
      .from("materi")
      .select("*, users!materi_guru_id_fkey(nama)")
      .eq("topik", topik)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return normalizeMateriList(data as Materi[]);
  } catch (err) {
    throw err;
  }
}

// Create materi baru
export async function createMateri(
  guruIdOrInput: string | MateriInput,
  judul?: string,
  deskripsi?: string,
  konten?: string,
  topik?: string
) {
  try {
    const payload =
      typeof guruIdOrInput === "string"
        ? {
            guru_id: guruIdOrInput,
            judul,
            deskripsi: deskripsi || null,
            konten: konten || "",
            topik,
            status: "published" as const,
          }
        : {
            ...guruIdOrInput,
            deskripsi: guruIdOrInput.deskripsi || null,
            konten: guruIdOrInput.konten || "",
            status: guruIdOrInput.status || "draft",
          };

    const { data, error } = await supabase
      .from("materi")
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (isMissingColumnError(error)) {
        const legacyPayload = {
          guru_id: payload.guru_id,
          judul: payload.judul,
          deskripsi: payload.deskripsi || null,
          topik: payload.topik,
          konten: serializeLegacyKonten(payload.konten, payload),
        };

        const { data: legacyData, error: legacyError } = await supabase
          .from("materi")
          .insert(legacyPayload)
          .select()
          .single();

        if (legacyError) throw new Error(legacyError.message);
        return normalizeMateri(legacyData as Materi);
      }

      throw new Error(error.message);
    }

    return normalizeMateri(data as Materi);
  } catch (err) {
    throw err;
  }
}

// Update materi
export async function updateMateri(id: string, updates: Partial<Materi>) {
  try {
    const { data, error } = await supabase
      .from("materi")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (isMissingColumnError(error)) {
        const legacyUpdates = {
          ...(updates.judul !== undefined && { judul: updates.judul }),
          ...(updates.deskripsi !== undefined && { deskripsi: updates.deskripsi }),
          ...(updates.topik !== undefined && { topik: updates.topik }),
          ...((updates.konten !== undefined || updates.file_url || updates.file_path || updates.file_name) && {
            konten: serializeLegacyKonten(updates.konten, updates),
          }),
          updated_at: new Date().toISOString(),
        };

        const { data: legacyData, error: legacyError } = await supabase
          .from("materi")
          .update(legacyUpdates)
          .eq("id", id)
          .select()
          .single();

        if (legacyError) throw new Error(legacyError.message);
        return normalizeMateri(legacyData as Materi);
      }

      throw new Error(error.message);
    }

    return normalizeMateri(data as Materi);
  } catch (err) {
    throw err;
  }
}

// Delete materi
export async function deleteMateri(id: string) {
  try {
    const { error } = await supabase
      .from("materi")
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
