import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getUsersByRole, registerUser, type User } from "@/services/userService";
import { supabase } from "@/integrations/supabase/client";

interface StudentWithQuiz extends User {
  quizDone: number;
}

export default function GuruMurid() {
  const [students, setStudents] = useState<StudentWithQuiz[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");

  useEffect(() => {
    fetchStudents();

    const channel = supabase
      .channel("guru-murid-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, fetchStudents)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_scores" }, fetchStudents)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const users = await getUsersByRole("murid");
      const { data: scores } = await supabase
        .from("quiz_scores")
        .select("murid_id, quiz_id");

      setStudents(users.map(user => ({
        ...user,
        quizDone: new Set((scores || []).filter(score => score.murid_id === user.id).map(score => score.quiz_id)).size,
      })));
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat murid");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
  };

  const handleAddStudent = async () => {
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      toast.error("Nama, email, dan password wajib diisi");
      return;
    }

    try {
      setSaving(true);
      await registerUser(formEmail.trim(), formPassword.trim(), formName.trim(), "murid");
      toast.success(`${formName.trim()} berhasil ditambahkan`);
      setDialogOpen(false);
      resetForm();
      await fetchStudents();
    } catch (err: any) {
      toast.error(err.message || "Gagal menambah murid");
    } finally {
      setSaving(false);
    }
  };

  const filtered = students.filter(s =>
    `${s.nama} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold">Daftar Murid</h2>
          <p className="text-muted-foreground">{students.length} murid terdaftar dari database</p>
        </div>
        <Button className="gradient-primary text-primary-foreground" onClick={() => setDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Tambah Murid
        </Button>
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
          <Card key={s.id} className="p-4 shadow-card border-0 flex items-center justify-between gap-4 hover:shadow-elevated transition-shadow">
            <div className="flex min-w-0 items-center gap-4">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                {s.nama[0]}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{s.nama}</p>
                <p className="text-sm text-muted-foreground truncate">{s.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-xp/10 text-xp">{s.xp || 0} XP</Badge>
              <Badge variant="secondary">Lv. {s.level || 1}</Badge>
              <Badge variant="outline">{s.quizDone} Quiz</Badge>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Murid</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nama murid" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="Email murid" type="email" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder="Password murid" type="text" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handleAddStudent} disabled={saving}>
              {saving ? "Menyimpan..." : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
