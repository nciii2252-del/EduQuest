import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle, Eye, FileText, Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MateriPreviewDialog } from "@/components/MateriPreviewDialog";
import { getAllMateri, type Materi } from "@/services/materiService";
import { addStudentXp } from "@/services/analyticsService";

interface StudentProgress {
  id: string;
  materi_id: string;
  progres_persen: number;
  status: string;
  last_accessed_at?: string;
}

export default function MuridMateri() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<Materi[]>([]);
  const [progressData, setProgressData] = useState<StudentProgress[]>([]);
  const [previewTarget, setPreviewTarget] = useState<Materi | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchMaterialsAndProgress();

      const channel = supabase
        .channel(`murid-materi-${user.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "materi" }, fetchMaterialsAndProgress)
        .on("postgres_changes", { event: "*", schema: "public", table: "student_progress", filter: `murid_id=eq.${user.id}` }, fetchMaterialsAndProgress)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  const fetchMaterialsAndProgress = async () => {
    try {
      const allMaterials = await getAllMateri();
      const publishedMaterials = allMaterials.filter(m => (m.status || "published") === "published");

      const { data: progressRows, error: progressError } = await supabase
        .from("student_progress")
        .select("*")
        .eq("murid_id", user?.id);

      if (progressError) {
        console.error("Error fetching progress:", progressError);
      }

      setMaterials(publishedMaterials);
      setProgressData(progressRows || []);
    } catch (err: any) {
      console.error("Error:", err);
      toast.error(err.message || "Gagal memuat materi");
    } finally {
      setLoading(false);
    }
  };

  const getMaterialProgress = (materialId: string) => {
    const progress = progressData.find(p => p.materi_id === materialId);
    return progress ? {
      progress: progress.progres_persen,
      status: progress.status,
      lastAccessed: progress.last_accessed_at
    } : {
      progress: 0,
      status: "belum",
      lastAccessed: null
    };
  };

  const handleAccessMaterial = async (material: Materi) => {
    if (!user?.id) return;

    try {
      const existingProgress = progressData.find(p => p.materi_id === material.id);
      const accessedAt = new Date().toISOString();

      if (existingProgress) {
        const nextStatus = existingProgress.status === "selesai" ? "selesai" : "sedang";
        const nextProgress = Math.max(existingProgress.progres_persen || 0, 50);

        const { error } = await supabase
          .from("student_progress")
          .update({
            last_accessed_at: accessedAt,
            status: nextStatus,
            progres_persen: nextProgress,
          })
          .eq("id", existingProgress.id);

        if (error) {
          console.error("Error updating progress:", error);
        } else {
          setProgressData(prev => prev.map(p =>
            p.id === existingProgress.id
              ? { ...p, last_accessed_at: accessedAt, status: nextStatus, progres_persen: nextProgress }
              : p
          ));
        }
      } else {
        const { data, error } = await supabase
          .from("student_progress")
          .insert({
            murid_id: user.id,
            materi_id: material.id,
            progres_persen: 50,
            status: "sedang",
            last_accessed_at: accessedAt
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating progress:", error);
        } else if (data) {
          setProgressData(prev => [...prev, data]);
        }
      }

      setPreviewTarget(material);
      setPreviewOpen(true);
    } catch (err) {
      console.error("Error:", err);
      toast.error("Gagal mengakses materi");
    }
  };

  const handleCompleteMaterial = async (material: Materi) => {
    if (!user?.id) return;

    try {
      const existingProgress = progressData.find(p => p.materi_id === material.id);
      const accessedAt = new Date().toISOString();
      const wasDone = (existingProgress?.progres_persen || 0) >= 100 || existingProgress?.status === "selesai";

      if (existingProgress) {
        const { error } = await supabase
          .from("student_progress")
          .update({ progres_persen: 100, status: "selesai", last_accessed_at: accessedAt })
          .eq("id", existingProgress.id);

        if (error) throw error;

        setProgressData(prev => prev.map(p =>
          p.id === existingProgress.id
            ? { ...p, progres_persen: 100, status: "selesai", last_accessed_at: accessedAt }
            : p
        ));
      } else {
        const { data, error } = await supabase
          .from("student_progress")
          .insert({
            murid_id: user.id,
            materi_id: material.id,
            progres_persen: 100,
            status: "selesai",
            last_accessed_at: accessedAt
          })
          .select()
          .single();

        if (error) throw error;
        setProgressData(prev => [...prev, data]);
      }

      if (!wasDone) {
        await addStudentXp(user.id, 100);
      }

      toast.success(`Materi "${material.judul}" ditandai selesai`);
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui progres");
    }
  };

  const handleOpenFile = async (material: Materi) => {
    if (!user?.id) return;

    try {
      const existingProgress = progressData.find(p => p.materi_id === material.id);
      const accessedAt = new Date().toISOString();

      if (existingProgress) {
        if ((existingProgress.progres_persen || 0) < 90 && existingProgress.status !== "selesai") {
          const { error } = await supabase
            .from("student_progress")
            .update({ progres_persen: 90, status: "sedang", last_accessed_at: accessedAt })
            .eq("id", existingProgress.id);

          if (error) {
            console.error("Error updating progress to 90%:", error);
          } else {
            setProgressData(prev => prev.map(p => p.id === existingProgress.id ? { ...p, progres_persen: 90, status: "sedang", last_accessed_at: accessedAt } : p));
          }
        }
      } else {
        const { data, error } = await supabase
          .from("student_progress")
          .insert({ murid_id: user.id, materi_id: material.id, progres_persen: 90, status: "sedang", last_accessed_at: accessedAt })
          .select()
          .single();

        if (error) {
          console.error("Error creating 90% progress:", error);
        } else if (data) {
          setProgressData(prev => [...prev, data]);
        }
      }
    } catch (err) {
      console.error("Error in handleOpenFile:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Materi Pemrograman Dasar</h2>
        <p className="text-muted-foreground">Pelajari materi yang diterbitkan admin dan guru</p>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">Memuat materi...</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Belum ada materi tersedia</p>
          </div>
        ) : (
          materials.map(m => {
            const progressInfo = getMaterialProgress(m.id);
            const canComplete = progressInfo.progress >= 90 && progressInfo.status !== "selesai";

            return (
              <Card key={m.id} className="p-5 shadow-card border-0 hover:shadow-elevated transition-shadow">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`p-3 rounded-xl ${progressInfo.status === "selesai" ? "gradient-xp" : progressInfo.status === "sedang" ? "gradient-primary" : "bg-muted"}`}>
                      {progressInfo.status === "selesai" ? <CheckCircle className="h-5 w-5 text-primary-foreground" /> : <BookOpen className="h-5 w-5 text-primary-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{m.judul}</h3>
                      <p className="text-xs text-muted-foreground">{m.deskripsi || m.topik}</p>
                      <p className="text-sm text-muted-foreground mt-1">{m.topik}</p>
                      {m.file_name && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><FileText className="h-3 w-3" /> {m.file_name}</p>}
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={progressInfo.progress} className="h-2 w-32" />
                        <span className="text-xs text-muted-foreground">{progressInfo.progress}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button className="gradient-primary text-primary-foreground" onClick={() => handleAccessMaterial(m)}>
                      {progressInfo.status === "selesai" ? <Eye className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                      {progressInfo.status === "selesai" ? "Tinjau" : "Pelajari"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleCompleteMaterial(m)} disabled={!canComplete}>
                      <CheckCircle className="mr-2 h-3 w-3" />
                      Selesai
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <MateriPreviewDialog materi={previewTarget} open={previewOpen} onOpenChange={setPreviewOpen} onOpenFile={handleOpenFile} />
    </div>
  );
}
