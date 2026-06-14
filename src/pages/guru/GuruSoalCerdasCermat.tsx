import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { INFORMATIKA_TOPICS } from "@/data/topics";

interface Question {
  id: string;
  pertanyaan: string;
  pilihan: string[];
  jawaban_benar: number;
  kategori: string;
}

export default function GuruSoalCerdasCermat() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [pertanyaan, setPertanyaan] = useState("");
  const [kategori, setKategori] = useState("");
  const [pilihan, setPilihan] = useState(["", "", "", ""]);
  const [jawaban, setJawaban] = useState(0);

  useEffect(() => {
    loadQuestions();
  }, [user?.id]);

  const loadQuestions = async () => {
    setLoading(true);
    setErrorMessage(null);
    const { data, error } = await supabase
      .from("cerdas_cermat_questions")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Load questions error:", error);
      toast.error("Gagal memuat soal");
      setErrorMessage(error.message);
    } else if (data) {
      setQuestions(data as Question[]);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setPertanyaan("");
    setKategori("");
    setPilihan(["", "", "", ""]);
    setJawaban(0);
    setEditing(null);
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (q: Question) => {
    setEditing(q);
    setPertanyaan(q.pertanyaan);
    setKategori(q.kategori);
    setPilihan([...q.pilihan]);
    setJawaban(q.jawaban_benar);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!pertanyaan.trim()) {
      toast.error("Pertanyaan tidak boleh kosong");
      return;
    }
    if (!kategori) {
      toast.error("Pilih kategori");
      return;
    }
    if (pilihan.some(p => !p.trim())) {
      toast.error("Semua pilihan harus diisi");
      return;
    }

    try {
      if (editing) {
        const { error } = await supabase
          .from("cerdas_cermat_questions")
          .update({
            pertanyaan,
            pilihan,
            jawaban_benar: jawaban,
            kategori,
          })
          .eq("id", editing.id);
        
        if (error) throw error;
        toast.success("Soal berhasil diperbarui");
      } else {
        const { data: inserted, error } = await supabase
          .from("cerdas_cermat_questions")
          .insert({
            pertanyaan,
            pilihan,
            jawaban_benar: jawaban,
            kategori,
          })
          .select()
          .single();
        
        if (error) throw error;
        toast.success("Soal berhasil ditambahkan");
      }
      
      setDialogOpen(false);
      resetForm();
      loadQuestions();
    } catch (err: any) {
      console.error("Save question error:", err);
      toast.error(err?.message ? `Terjadi kesalahan: ${err.message}` : "Terjadi kesalahan saat menyimpan");
      setErrorMessage(err?.message ?? "Terjadi kesalahan saat menyimpan");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const { error } = await supabase
        .from("cerdas_cermat_questions")
        .delete()
        .eq("id", deleteTarget.id);
      
      if (error) throw error;
      toast.success("Soal berhasil dihapus");
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      loadQuestions();
    } catch (err) {
      toast.error("Gagal menghapus soal");
    }
  };

  const updatePilihan = (idx: number, value: string) => {
    const newPilihan = [...pilihan];
    newPilihan[idx] = value;
    setPilihan(newPilihan);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Bank Soal Cerdas Cermat</h2>
          <p className="text-muted-foreground">Siapkan soal untuk sesi cerdas cermat yang akan datang</p>
        </div>
        <Button className="gradient-primary text-primary-foreground" onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Soal
        </Button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Memuat soal...</p>
          </div>
        ) : errorMessage ? (
          <Card className="p-6 border border-destructive/20 bg-destructive/5 text-destructive">
            <p className="font-semibold">Terjadi kesalahan saat memuat soal</p>
            <p className="text-sm mt-2">{errorMessage}</p>
          </Card>
        ) : questions.length === 0 ? (
          <Card className="p-12 text-center shadow-card border-0">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold mb-2">Belum ada soal</h3>
            <p className="text-sm text-muted-foreground mb-6">Mulai buat soal cerdas cermat untuk persiapan sesi mendatang</p>
            <Button className="gradient-primary text-primary-foreground" onClick={openAdd}>
              <Plus className="mr-2 h-4 w-4" /> Buat Soal Pertama
            </Button>
          </Card>
        ) : (
          questions.map((q) => (
            <Card key={q.id} className="p-5 shadow-card border-0 hover:shadow-elevated transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{q.kategori}</Badge>
                      <Badge variant="secondary">
                        Jawaban: {String.fromCharCode(65 + q.jawaban_benar)}
                      </Badge>
                    </div>
                    <h3 className="font-semibold">{q.pertanyaan}</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(q)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setDeleteTarget(q);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {q.pilihan.map((opt, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded text-sm ${
                        idx === q.jawaban_benar
                          ? "bg-green-100 text-green-800 border border-green-300"
                          : "bg-muted"
                      }`}
                    >
                      <span className="font-semibold">{String.fromCharCode(65 + idx)}.</span> {opt}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Soal" : "Tambah Soal Baru"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Kategori</Label>
              <Select value={kategori} onValueChange={setKategori}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INFORMATIKA_TOPICS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Pertanyaan</Label>
              <Textarea
                value={pertanyaan}
                onChange={(e) => setPertanyaan(e.target.value)}
                placeholder="Ketik pertanyaan..."
                className="min-h-24"
              />
            </div>

            <div>
              <Label>Pilihan Jawaban</Label>
              <div className="space-y-2">
                {pilihan.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={opt}
                      onChange={(e) => updatePilihan(idx, e.target.value)}
                      placeholder={`Pilihan ${String.fromCharCode(65 + idx)}`}
                    />
                    <input
                      type="radio"
                      name="jawaban"
                      checked={jawaban === idx}
                      onChange={() => setJawaban(idx)}
                      className="w-4 h-4 cursor-pointer"
                      title="Pilih sebagai jawaban benar"
                    />
                    <span className="text-sm text-muted-foreground">
                      {String.fromCharCode(65 + idx)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button
              className="gradient-primary text-primary-foreground"
              onClick={handleSave}
            >
              {editing ? "Perbarui" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Soal?</AlertDialogTitle>
            <AlertDialogDescription>
              Soal "{deleteTarget?.pertanyaan}" akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
