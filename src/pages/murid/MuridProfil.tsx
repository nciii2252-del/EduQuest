import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { XpBadge } from "@/components/XpBadge";
import { LevelBadge } from "@/components/LevelBadge";
import { StreakBadge } from "@/components/StreakBadge";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import { getStudentBadges, getStudentStats, type StudentBadges, type StudentStats } from "@/services/analyticsService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const badgeMeta = [
  { key: "quizMaster", icon: "🏆", title: "Quiz Master" },
  { key: "onFire", icon: "🔥", title: "On Fire!" },
  { key: "bintangKelas", icon: "⭐", title: "Bintang Kelas" },
  { key: "kutuBuku", icon: "📚", title: "Kutu Buku" },
  { key: "roketBelajar", icon: "🚀", title: "Roket Belajar" },
  { key: "legendaris", icon: "💎", title: "Legendaris" },
] as const;

export default function MuridProfil() {
  const { user } = useAuth();
  const [animatingBadge, setAnimatingBadge] = useState<string | null>(null);
  const [badges, setBadges] = useState<StudentBadges | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);

  const storageKey = useMemo(() => user?.id ? `earned-badges-${user.id}` : "", [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    fetchProfile();

    const channel = supabase
      .channel(`murid-profile-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "users", filter: `id=eq.${user.id}` }, fetchProfile)
      .on("postgres_changes", { event: "*", schema: "public", table: "student_progress", filter: `murid_id=eq.${user.id}` }, fetchProfile)
      .on("postgres_changes", { event: "*", schema: "public", table: "quiz_scores", filter: `murid_id=eq.${user.id}` }, fetchProfile)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) return;

    try {
      const [nextStats, nextBadges] = await Promise.all([
        getStudentStats(user.id),
        getStudentBadges(user.id),
      ]);

      const previous = storageKey ? JSON.parse(localStorage.getItem(storageKey) || "[]") as string[] : [];
      const current = badgeMeta.filter((badge) => nextBadges[badge.key]).map((badge) => badge.key);
      const newlyEarned = current.find((key) => !previous.includes(key));

      if (newlyEarned) {
        const meta = badgeMeta.find((badge) => badge.key === newlyEarned);
        setAnimatingBadge(newlyEarned);
        toast.success(`Badge didapat: ${meta?.title}`);
        setTimeout(() => setAnimatingBadge(null), 1200);
      }

      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(current));
      setStats(nextStats);
      setBadges(nextBadges);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat profil");
    }
  };

  const handleBadgeClick = (key: keyof StudentBadges, earned: boolean) => {
    if (earned) {
      setAnimatingBadge(key);
      setTimeout(() => setAnimatingBadge(null), 1000);
    }
  };

  if (!user) return null;

  const profileStats = stats || {
    xp: user.xp ?? 0,
    level: user.level ?? 1,
    streak: user.streak ?? 0,
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-display font-bold">Profil Saya</h2>
      </div>

      <Card className="p-6 shadow-elevated border-0">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full gradient-hero flex items-center justify-center text-3xl font-bold text-primary-foreground font-display">
            {user.nama[0]}
          </div>
          <div>
            <h3 className="text-xl font-display font-bold">{user.nama}</h3>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <XpBadge xp={profileStats.xp} />
              <LevelBadge level={profileStats.level} />
              <StreakBadge streak={profileStats.streak} />
            </div>
          </div>
        </div>
      </Card>

      <div>
        <h3 className="font-display font-semibold text-lg mb-3">Badge Koleksi</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {badgeMeta.map((badge) => {
            const earned = !!badges?.[badge.key];

            return (
              <Card
                key={badge.key}
                className={`p-4 text-center shadow-card border-0 ${!earned ? "opacity-40 grayscale" : "hover:shadow-elevated cursor-pointer"} transition-all ${animatingBadge === badge.key ? "animate-bounce scale-110" : ""}`}
                onClick={() => handleBadgeClick(badge.key, earned)}
              >
                <div className={`text-3xl mb-1 ${animatingBadge === badge.key ? "animate-pulse" : ""}`}>{badge.icon}</div>
                <p className="text-sm font-semibold">{badge.title}</p>
                {earned && <Badge className="mt-1 gradient-xp text-xp-foreground border-0 text-xs">Didapat!</Badge>}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
