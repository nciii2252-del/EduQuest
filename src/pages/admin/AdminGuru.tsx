import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getUsersByRole, type User } from "@/services/userService";
import { supabase } from "@/integrations/supabase/client";

interface Teacher extends User {
  subjects: string[];
  materials: number;
  quizzes: number;
}

export default function AdminGuru() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeachers();

    const channel = supabase
      .channel("admin-guru-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, fetchTeachers)
      .on("postgres_changes", { event: "*", schema: "public", table: "materi" }, fetchTeachers)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz" }, fetchTeachers)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const [users, { data: materials }, { data: quizzes }] = await Promise.all([
        getUsersByRole("guru"),
        supabase.from("materi").select("guru_id, topik"),
        supabase.from("quiz").select("guru_id, topik"),
      ]);

      setTeachers(users.map((teacher) => {
        const teacherMaterials = (materials || []).filter((item: any) => item.guru_id === teacher.id);
        const teacherQuizzes = (quizzes || []).filter((item: any) => item.guru_id === teacher.id);
        const subjects = [...new Set([...teacherMaterials, ...teacherQuizzes].map((item: any) => item.topik))];

        return {
          ...teacher,
          subjects,
          materials: teacherMaterials.length,
          quizzes: teacherQuizzes.length,
        };
      }));
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat guru");
    } finally {
      setLoading(false);
    }
  };

  const filtered = teachers.filter(t => `${t.nama} ${t.email}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Kelola Guru Informatika</h2>
        <p className="text-muted-foreground">{teachers.length} guru terdaftar dari database</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari guru..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-3">
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Memuat guru...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Tidak ada guru ditemukan</p>
        ) : filtered.map(t => (
          <Card key={t.id} className="p-4 shadow-card border-0 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">{t.nama[0]}</div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{t.nama}</p>
                <p className="text-sm text-muted-foreground truncate">{t.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {t.subjects.length === 0 ? <Badge variant="outline">Belum ada topik</Badge> : t.subjects.map(s => <Badge key={s} variant="outline">{s}</Badge>)}
              <Badge variant="secondary">{t.materials} materi</Badge>
              <Badge variant="secondary">{t.quizzes} quiz</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
