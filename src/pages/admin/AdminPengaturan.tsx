import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Shield, Bell, Database, Lock, Cloud } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminPengaturan() {
  const [platformName, setPlatformName] = useState("CodeQuest");
  const [openRegistration, setOpenRegistration] = useState(false);
  const [xpPerMateri, setXpPerMateri] = useState(100);
  const [leaderboard, setLeaderboard] = useState(true);
  const [badgeSystem, setBadgeSystem] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [maxFileSize, setMaxFileSize] = useState(10);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSave = () => {
    toast.success("Pengaturan berhasil disimpan!");
  };

  const handleReset = () => {
    setPlatformName("CodeQuest");
    setOpenRegistration(false);
    setXpPerMateri(100);
    setLeaderboard(true);
    setBadgeSystem(true);
    setEmailNotif(true);
    toast.info("Pengaturan dikembalikan ke default");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-display font-bold">Pengaturan ⚙️</h2>
        <p className="text-muted-foreground">Konfigurasi platform CodeQuest (Informatika)</p>
      </div>

      <Card className="p-6 shadow-card border-0 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold">Umum</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Platform</Label>
            <Input value={platformName} onChange={e => setPlatformName(e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Mode Pendaftaran Terbuka</p>
              <p className="text-xs text-muted-foreground">Murid bisa mendaftar sendiri</p>
            </div>
            <Switch checked={openRegistration} onCheckedChange={setOpenRegistration} />
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-card border-0 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold">Gamifikasi</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">XP per Materi Selesai</p>
              <p className="text-xs text-muted-foreground">XP yang didapat murid</p>
            </div>
            <Input className="w-24" type="number" value={xpPerMateri} onChange={e => setXpPerMateri(Number(e.target.value))} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Papan Peringkat</p>
              <p className="text-xs text-muted-foreground">Tampilkan leaderboard</p>
            </div>
            <Switch checked={leaderboard} onCheckedChange={setLeaderboard} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Badge System</p>
              <p className="text-xs text-muted-foreground">Aktifkan sistem badge</p>
            </div>
            <Switch checked={badgeSystem} onCheckedChange={setBadgeSystem} />
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-card border-0 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold">Notifikasi</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Notifikasi Email</p>
              <p className="text-xs text-muted-foreground">Kirim email saat ada aktivitas penting</p>
            </div>
            <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-card border-0 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Lock className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold">Keamanan</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground">Aktifkan 2FA untuk admin</p>
            </div>
            <Switch checked={twoFactorAuth} onCheckedChange={setTwoFactorAuth} />
          </div>
          <div className="space-y-2">
            <Label>Timeout Sesi (menit)</Label>
            <Input type="number" value={sessionTimeout} onChange={e => setSessionTimeout(Number(e.target.value))} />
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-card border-0 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Database className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold">Sistem</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Frekuensi Backup</Label>
            <Select value={backupFrequency} onValueChange={setBackupFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Per Jam</SelectItem>
                <SelectItem value="daily">Harian</SelectItem>
                <SelectItem value="weekly">Mingguan</SelectItem>
                <SelectItem value="monthly">Bulanan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Maksimal Ukuran File (MB)</Label>
            <Input type="number" value={maxFileSize} onChange={e => setMaxFileSize(Number(e.target.value))} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Mode Maintenance</p>
              <p className="text-xs text-muted-foreground">Nonaktifkan akses sementara</p>
            </div>
            <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-card border-0 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <Cloud className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold">Integrasi</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>API Key Supabase</Label>
            <Input type="password" placeholder="Masukkan API key..." />
          </div>
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <Input placeholder="https://..." />
          </div>
          <Button variant="outline" size="sm">Test Koneksi</Button>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button className="gradient-primary text-primary-foreground" onClick={handleSave}>Simpan Pengaturan</Button>
        <Button variant="outline" onClick={handleReset}>Reset Default</Button>
      </div>
    </div>
  );
}
