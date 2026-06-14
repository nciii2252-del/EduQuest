import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText } from "lucide-react";
import { getMateriFileUrl, type Materi } from "@/services/materiService";

interface MateriPreviewDialogProps {
  materi: Materi | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenFile?: (materi: Materi) => Promise<void> | void;
}

export function MateriPreviewDialog({ materi, open, onOpenChange, onOpenFile }: MateriPreviewDialogProps) {
  const fileUrl = materi ? getMateriFileUrl(materi) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{materi?.judul || "Tinjau Materi"}</DialogTitle>
        </DialogHeader>

        {materi && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={materi.status === "published" ? "default" : "secondary"}>
                {materi.status === "published" ? "Terbit" : "Draf"}
              </Badge>
              <Badge variant="outline">{materi.topik}</Badge>
              {materi.users?.nama && (
                <span className="text-sm text-muted-foreground">oleh {materi.users.nama}</span>
              )}
            </div>

            {materi.deskripsi && (
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">Deskripsi</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{materi.deskripsi}</p>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Konten</h3>
              <div className="min-h-32 rounded-md border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {materi.konten?.trim() || "Belum ada konten teks. Gunakan file materi untuk meninjau isi lengkapnya."}
              </div>
            </div>

            {fileUrl && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">File Materi</h3>
                <div className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText className="h-5 w-5 shrink-0 text-primary" />
                    <span className="truncate text-sm">{materi.file_name || "File materi"}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (materi && typeof onOpenFile === "function") {
                        try {
                          await onOpenFile(materi);
                        } catch (e) {
                          // ignore errors from parent handler
                          console.error(e);
                        }
                      }
                      window.open(fileUrl, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Buka
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
