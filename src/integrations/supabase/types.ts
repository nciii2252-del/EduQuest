export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password: string
          nama: string
          role: string
          xp: number
          level: number
          streak: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password: string
          nama: string
          role: string
          xp?: number
          level?: number
          streak?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password?: string
          nama?: string
          role?: string
          xp?: number
          level?: number
          streak?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      materi: {
        Row: {
          id: string
          guru_id: string
          judul: string
          deskripsi: string | null
          konten: string | null
          topik: string
          status: string
          file_url: string | null
          file_name: string | null
          file_path: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          guru_id: string
          judul: string
          deskripsi?: string | null
          konten?: string | null
          topik: string
          status?: string
          file_url?: string | null
          file_name?: string | null
          file_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          guru_id?: string
          judul?: string
          deskripsi?: string | null
          konten?: string | null
          topik?: string
          status?: string
          file_url?: string | null
          file_name?: string | null
          file_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materi_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      quiz: {
        Row: {
          id: string
          guru_id: string
          judul: string
          deskripsi: string | null
          topik: string
          total_soal: number
          durasi_menit: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          guru_id: string
          judul: string
          deskripsi?: string | null
          topik: string
          total_soal: number
          durasi_menit?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          guru_id?: string
          judul?: string
          deskripsi?: string | null
          topik?: string
          total_soal?: number
          durasi_menit?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      quiz_questions: {
        Row: {
          id: string
          quiz_id: string
          pertanyaan: string
          pilihan: Json
          jawaban_benar: number
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          pertanyaan: string
          pilihan: Json
          jawaban_benar: number
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          pertanyaan?: string
          pilihan?: Json
          jawaban_benar?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quiz"
            referencedColumns: ["id"]
          }
        ]
      }
      student_progress: {
        Row: {
          id: string
          murid_id: string
          materi_id: string
          status: string
          progres_persen: number
          last_accessed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          murid_id: string
          materi_id: string
          status?: string
          progres_persen?: number
          last_accessed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          murid_id?: string
          materi_id?: string
          status?: string
          progres_persen?: number
          last_accessed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_progress_murid_id_fkey"
            columns: ["murid_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_progress_materi_id_fkey"
            columns: ["materi_id"]
            isOneToOne: false
            referencedRelation: "materi"
            referencedColumns: ["id"]
          }
        ]
      }
      quiz_scores: {
        Row: {
          id: string
          murid_id: string
          quiz_id: string
          skor: number
          total_benar: number
          total_soal: number
          waktu_pengerjaan_detik: number | null
          submitted_at: string
        }
        Insert: {
          id?: string
          murid_id: string
          quiz_id: string
          skor: number
          total_benar: number
          total_soal: number
          waktu_pengerjaan_detik?: number | null
          submitted_at?: string
        }
        Update: {
          id?: string
          murid_id?: string
          quiz_id?: string
          skor?: number
          total_benar?: number
          total_soal?: number
          waktu_pengerjaan_detik?: number | null
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_scores_murid_id_fkey"
            columns: ["murid_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_scores_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quiz"
            referencedColumns: ["id"]
          }
        ]
      }
      cerdas_cermat_buzzes: {
        Row: {
          buzzed_at: string
          id: string
          participant_id: string
          question_index: number
          room_id: string
        }
        Insert: {
          buzzed_at?: string
          id?: string
          participant_id: string
          question_index: number
          room_id: string
        }
        Update: {
          buzzed_at?: string
          id?: string
          participant_id?: string
          question_index?: number
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cerdas_cermat_buzzes_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "cerdas_cermat_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cerdas_cermat_buzzes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "cerdas_cermat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      cerdas_cermat_participants: {
        Row: {
          id: string
          joined_at: string
          nama: string
          room_id: string
          skor: number
        }
        Insert: {
          id?: string
          joined_at?: string
          nama: string
          room_id: string
          skor?: number
        }
        Update: {
          id?: string
          joined_at?: string
          nama?: string
          room_id?: string
          skor?: number
        }
        Relationships: [
          {
            foreignKeyName: "cerdas_cermat_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "cerdas_cermat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      cerdas_cermat_questions: {
        Row: {
          created_at: string
          id: string
          jawaban_benar: number
          kategori: string
          pertanyaan: string
          pilihan: Json
        }
        Insert: {
          created_at?: string
          id?: string
          jawaban_benar: number
          kategori: string
          pertanyaan: string
          pilihan: Json
        }
        Update: {
          created_at?: string
          id?: string
          jawaban_benar?: number
          kategori?: string
          pertanyaan?: string
          pilihan?: Json
        }
        Relationships: []
      }
      cerdas_cermat_rooms: {
        Row: {
          created_at: string
          current_question_index: number
          host_name: string
          host_secret: string
          id: string
          kode_room: string
          question_started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_question_index?: number
          host_name: string
          host_secret: string
          id?: string
          kode_room: string
          question_started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_question_index?: number
          host_name?: string
          host_secret?: string
          id?: string
          kode_room?: string
          question_started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
