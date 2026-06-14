import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Edit, Eye, FileText, Plus, Search, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { INFORMATIKA_TOPICS } from "@/data/topics";
import { useAuth } from "@/contexts/AuthContext";
import { createMateri, deleteMateri, getAllMateri, updateMateri, uploadMateriFile, type Materi } from "@/services/materiService";
import { MateriPreviewDialog } from "@/components/MateriPreviewDialog";
import { supabase } from "@/integrations/supabase/client";

export default function AdminMateri() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [materials, setMaterials] = useState<Materi[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Materi | null>(null);
  const [previewTarget, setPreviewTarget] = useState<Materi | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Materi | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formTopic, setFormTopic] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formStatus, setFormStatus] = useState<"published" | "draft">("published");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMaterials();

    const channel = supabase
      .channel("admin-materi-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "materi" }, fetchMaterials)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setMaterials(await getAllMateri());
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat materi");
    } finally {
      setLoading(false);
    }
  };

  const filtered = materials.filter(m =>
    `${m.judul} ${m.topik} ${m.deskripsi || ""} ${m.users?.nama || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setFormTitle("");
    setFormTopic("");
    setFormDescription("");
    setFormContent("");
    setFormStatus("published");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openAdd = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (m: Materi) => {
    setEditing(m);
    setFormTitle(m.judul);
    setFormTopic(m.topik);
    setFormDescription(m.deskripsi || "");
    setFormContent(m.konten || "");
    setFormStatus(m.status || "published");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setDialogOpen(true);
  };

  const openPreview = (m: Materi) => {
    setPreviewTarget(m);
    setPreviewOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] || null);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formTopic) {
      toast.error("Judul dan topik wajib diisi");
      return;
    }

    if (!user?.id) {
      toast.error("Admin belum login");
      return;
    }

    try {
      setSaving(true);
      const fileData = selectedFile ? await uploadMateriFile(selectedFile, user.id, formTitle) : {};
      const payload = {
        guru_id: editing?.guru_id || user.id,
        judul: formTitle.trim(),
        topik: formTopic,
        deskripsi: formDescription.trim() || null,
        konten: formContent.trim() || "",
        status: formStatus,
        ...fileData,
      };

      if (editing) {
        const updated = await updateMateri(editing.id, payload);
        setMaterials(prev => prev.map(m => m.id === editing.id ? { ...m, ...updated } : m));
        toast.success(`Materi "${formTitle}" berhasil diperbarui`);
      } else {
        const created = await createMateri(payload);
        setMaterials(prev => [created, ...prev]);
        toast.success(`Materi "${formTitle}" berhasil ditambahkan`);
      }

      setDialogOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan materi");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMateri(deleteTarget.id);
      setMaterials(prev => prev.filter(m => m.id !== deleteTarget.id));
      toast.success(`Materi "${deleteTarget.judul}" berhasil dihapus`);
      setDeleteDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus materi");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold">Kelola Materi</h2>
          <p className="text-muted-foreground">Materi Informatika dari admin dan guru tersinkron ke semua role</p>
        </div>
        <Button className="gradient-primary text-primary-foreground" onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Materi
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Cari materi..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <div className="col-span-full py-8 text-center text-muted-foreground">Memuat materi...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-8 text-center text-muted-foreground">Belum ada materi</div>
        ) : filtered.map(m => (
          <Card key={m.id} className="p-5 shadow-card border-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><BookOpen className="h-5 w-5 text-primary" /></div>
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{m.judul}</h3>
                  <p className="text-sm text-muted-foreground">{m.topik} oleh {m.users?.nama || (m.guru_id === user?.id ? user.nama : "Pengajar")}</p>
                  {m.deskripsi && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.deskripsi}</p>}
                  {m.file_name && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><FileText className="h-3 w-3" /> {m.file_name}</p>}
                </div>
              </div>
              <Badge variant={m.status === "published" ? "default" : "secondary"}>
                {m.status === "published" ? "Terbit" : "Draf"}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => openPreview(m)}><Eye className="mr-1 h-3 w-3" /> Tinjau</Button>
              <Button variant="outline" size="sm" onClick={() => openEdit(m)}><Edit className="mr-1 h-3 w-3" /> Edit</Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { setDeleteTarget(m); setDeleteDialogOpen(true); }}><Trash2 className="mr-1 h-3 w-3" /> Hapus</Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Materi" : "Tambah Materi Baru"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Judul</Label><Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Judul materi" /></div>
            <div className="space-y-2">
              <Label>Topik</Label>
              <Select value={formTopic} onValueChange={setFormTopic}>
                <SelectTrigger><SelectValue placeholder="Pilih topik" /></SelectTrigger>
                <SelectContent>{INFORMATIKA_TOPICS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Deskripsi</Label><Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Deskripsi singkat materi..." rows={3} /></div>
            <div className="space-y-2"><Label>Konten Teks</Label><Textarea value={formContent} onChange={e => setFormContent(e.target.value)} placeholder="Isi materi atau catatan untuk siswa..." rows={7} /></div>
            <div className="space-y-2">
              <Label>Upload File Materi</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">{selectedFile ? selectedFile.name : editing?.file_name || "Pilih file materi"}</p>
                <p className="text-xs text-muted-foreground">PDF, gambar, dokumen, spreadsheet - Max 10MB</p>
              </div>
              <input ref={fileInputRef} type="file" hidden accept=".pdf,.jpg,.jpeg,.png,.docx,.doc,.xlsx,.xls,.ppt,.pptx,.txt" onChange={handleFileSelect} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formStatus} onValueChange={v => setFormStatus(v as "published" | "draft")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draf</SelectItem>
                  <SelectItem value="published">Terbitkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MateriPreviewDialog materi={previewTarget} open={previewOpen} onOpenChange={setPreviewOpen} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Materi?</AlertDialogTitle>
            <AlertDialogDescription>Apakah Anda yakin ingin menghapus <strong>"{deleteTarget?.judul}"</strong>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
