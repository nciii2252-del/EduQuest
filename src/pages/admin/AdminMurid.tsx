import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getUsersByRole, type User } from "@/services/userService";
import { supabase } from "@/integrations/supabase/client";

interface Student extends User {
  quizDone: number;
  materialDone: number;
}

export default function AdminMurid() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();

    const channel = supabase
      .channel("admin-murid-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, fetchStudents)
      .on("postgres_changes", { event: "*", schema: "public", table: "student_progress" }, fetchStudents)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_scores" }, fetchStudents)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const [users, { data: scores }, { data: progress }] = await Promise.all([
        getUsersByRole("murid"),
        supabase.from("quiz_scores").select("murid_id, quiz_id"),
        supabase.from("student_progress").select("murid_id, materi_id, progres_persen"),
      ]);

      setStudents(users.map((student) => ({
        ...student,
        quizDone: new Set((scores || []).filter((score: any) => score.murid_id === student.id).map((score: any) => score.quiz_id)).size,
        materialDone: new Set((progress || []).filter((item: any) => item.murid_id === student.id && (item.progres_persen || 0) >= 100).map((item: any) => item.materi_id)).size,
      })));
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat murid");
    } finally {
      setLoading(false);
    }
  };

  const filtered = students.filter(s =>
    `${s.nama} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Kelola Murid</h2>
        <p className="text-muted-foreground">{students.length} murid terdaftar dari database</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari murid..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-3">
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Memuat murid...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Tidak ada murid ditemukan</p>
        ) : filtered.map(s => (
          <Card key={s.id} className="p-4 shadow-card border-0 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">{s.nama[0]}</div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{s.nama}</p>
                <p className="text-sm text-muted-foreground truncate">{s.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Badge className="bg-xp/10 text-xp border-0">{s.xp || 0} XP</Badge>
              <Badge variant="secondary">Lv.{s.level || 1}</Badge>
              <Badge variant="outline">{s.quizDone} quiz</Badge>
              <Badge variant="outline">{s.materialDone} materi selesai</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
