import { useState } from "react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Gamepad2, GraduationCap, BookOpen, Shield, AlertCircle } from "lucide-react";

const roles: { role: UserRole; label: string; icon: any; desc: string }[] = [
  { role: "guru", label: "Guru", icon: GraduationCap, desc: "Kelola kelas dan materi" },
  { role: "murid", label: "Murid", icon: BookOpen, desc: "Belajar dan kerjakan quiz" },
  { role: "admin", label: "Admin", icon: Shield, desc: "Kelola seluruh sistem" },
];

export default function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>("murid");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password, selectedRole);
    } catch (err) {
      // Error already handled in useAuth
      console.error("Login error:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
            <Gamepad2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold">CodeQuest</h1>
          <p className="text-muted-foreground mt-2">Gamifikasi Informatika - Pemrograman Dasar</p>
        </div>

        <Card className="p-6 shadow-elevated border-0">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label className="text-sm font-medium mb-3 block">Masuk sebagai</Label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map(({ role, label, icon: Icon, desc }) => (
                  <button
                    key={role}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setSelectedRole(role)}
                    className={`p-3 rounded-xl border-2 text-center transition-all duration-200 disabled:opacity-50 ${
                      selectedRole === role
                        ? "border-primary bg-sidebar-accent"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <Icon className={`h-6 w-6 mx-auto mb-1 ${selectedRole === role ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="email@contoh.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Masukkan kata sandi" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full gradient-primary text-primary-foreground font-semibold h-11"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Masuk"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Gunakan akun yang sudah terdaftar di sistem sekolah.
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
