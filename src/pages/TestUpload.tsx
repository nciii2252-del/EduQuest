import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Upload, Download } from "lucide-react";

export default function TestUpload() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const testUpload = async () => {
    if (!selectedFile) {
      toast.error("Pilih file dulu!");
      return;
    }

    if (!user?.id) {
      toast.error("User belum login!");
      return;
    }

    setUploading(true);

    try {
      console.log("🚀 Starting upload...");
      console.log("User ID:", user.id);
      console.log("File:", selectedFile.name, selectedFile.size, "bytes");

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `test_${Date.now()}.${fileExt}`;

      console.log("Target path:", `${user.id}/${fileName}`);

      const { data, error } = await supabase.storage
        .from("materi_files")
        .upload(`${user.id}/${fileName}`, selectedFile);

      if (error) {
        console.error("❌ Upload error:", error);
        toast.error(`Upload failed: ${error.message}`);
        return;
      }

      console.log("✅ Upload success:", data);

      const fileUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/materi_files/${data.path}`;
      setUploadedUrl(fileUrl);

      toast.success("Upload berhasil!");
      console.log("📁 File URL:", fileUrl);

    } catch (err: any) {
      console.error("💥 Exception:", err);
      toast.error(`Exception: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const testListFiles = async () => {
    try {
      console.log("📋 Listing files...");
      const { data, error } = await supabase.storage
        .from("materi_files")
        .list(user?.id || '', { limit: 10 });

      if (error) {
        console.error("❌ List error:", error);
        toast.error(`List failed: ${error.message}`);
        return;
      }

      console.log("📁 Files:", data);
      toast.success(`Found ${data?.length || 0} files`);
    } catch (err: any) {
      console.error("💥 List exception:", err);
      toast.error(`List exception: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-display font-bold">🧪 Test Upload File</h2>
        <p className="text-muted-foreground">Debug upload file ke Supabase Storage</p>
      </div>

      <Card className="p-6 space-y-4">
        <div>
          <Label>User ID: {user?.id || "Not logged in"}</Label>
        </div>

        <div>
          <Label>Pilih File</Label>
          <Input
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png,.docx"
          />
          {selectedFile && (
            <p className="text-sm text-muted-foreground mt-1">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={testUpload} disabled={uploading || !selectedFile}>
            {uploading ? "Uploading..." : "Test Upload"}
          </Button>
          <Button variant="outline" onClick={testListFiles}>
            List Files
          </Button>
        </div>

        {uploadedUrl && (
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-800">✅ Upload Success!</p>
            <p className="text-xs text-green-600 break-all">{uploadedUrl}</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => window.open(uploadedUrl, '_blank')}
            >
              <Download className="mr-1 h-3 w-3" /> Open File
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}