import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, Trophy, Hand, LogOut, Users, Crown, Medal, Award } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

type Question = { id: string; pertanyaan: string; pilihan: string[]; jawaban_benar: number; kategori: string };
type Room = { id: string; kode_room: string; status: string; current_question_index: number };
type Participant = { id: string; nama: string; skor: number };
type Buzz = { id: string; participant_id: string; question_index: number; buzzed_at: string };

export default function MuridCerdasCermat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [kode, setKode] = useState("");
  const [nama, setNama] = useState(user?.nama ?? "");
  const [room, setRoom] = useState<Room | null>(null);
  const [me, setMe] = useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [buzzes, setBuzzes] = useState<Buzz[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [joining, setJoining] = useState(false);
  const [buzzing, setBuzzing] = useState(false);

  useEffect(() => {
    supabase.from("cerdas_cermat_questions").select("*").then(({ data }) => {
      if (data) setQuestions(data as any);
    });
  }, []);

  const fetchRoomState = async (roomId: string) => {
    const [{ data: p, error: pErr }, { data: b, error: bErr }, { data: r, error: rErr }] = await Promise.all([
      supabase.from("cerdas_cermat_participants").select("*").eq("room_id", roomId).order("joined_at"),
      supabase.from("cerdas_cermat_buzzes").select("*").eq("room_id", roomId).order("buzzed_at"),
      supabase.from("cerdas_cermat_rooms").select("*").eq("id", roomId).single(),
    ]);

    if (pErr || bErr || rErr) {
      console.error("Murid Cerdas Cermat fetch error", pErr || bErr || rErr);
    }

    if (p) setParticipants(p as any);
    if (b) setBuzzes(b as any);
    if (r) setRoom(r as any);
    if (me && p) {
      const updated = (p as any[]).find((x) => x.id === me.id);
      if (updated) setMe(updated);
    }
  };

  useEffect(() => {
    if (!room) return;
    if (questions.length === 0) {
      supabase.from("cerdas_cermat_questions").select("*").then(({ data }) => {
        if (data) setQuestions(data as any);
      });
    }

    fetchRoomState(room.id);
    const interval = window.setInterval(() => fetchRoomState(room.id), 3000);

    const ch = supabase
      .channel(`murid-room-${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cerdas_cermat_participants", filter: `room_id=eq.${room.id}` }, () => fetchRoomState(room.id))
      .on("postgres_changes", { event: "*", schema: "public", table: "cerdas_cermat_buzzes", filter: `room_id=eq.${room.id}` }, () => fetchRoomState(room.id))
      .on("postgres_changes", { event: "*", schema: "public", table: "cerdas_cermat_rooms", filter: `id=eq.${room.id}` }, () => fetchRoomState(room.id))
      .subscribe();
    return () => {
      window.clearInterval(interval);
      supabase.removeChannel(ch);
    };
  }, [room?.id, questions.length]);

  const join = async () => {
    if (!kode.trim() || !nama.trim()) {
      toast({ title: "Lengkapi kode & nama", variant: "destructive" });
      return;
    }
    setJoining(true);
    const { data: r, error: rerr } = await supabase
      .from("cerdas_cermat_rooms")
      .select("*")
      .eq("kode_room", kode.trim().toUpperCase())
      .maybeSingle();
    if (rerr || !r) {
      setJoining(false);
      toast({ title: "Room tidak ditemukan", variant: "destructive" });
      return;
    }
    const { data: p, error: perr } = await supabase
      .from("cerdas_cermat_participants")
      .insert({ room_id: r.id, nama: nama.trim(), skor: 0 })
      .select()
      .single();
    setJoining(false);
    if (perr || !p) {
      toast({ title: "Gagal bergabung", description: perr?.message, variant: "destructive" });
      return;
    }
    setRoom(r as any);
    setMe(p as any);
    setParticipants((prev) => [...prev, p as any]);
    fetchRoomState(r.id);
    toast({ title: "Bergabung!", description: `Selamat datang di room ${r.kode_room}` });
  };

  const leave = async () => {
    if (me) await supabase.from("cerdas_cermat_participants").delete().eq("id", me.id);
    setRoom(null);
    setMe(null);
    setBuzzes([]);
    setParticipants([]);
  };

  const buzz = async () => {
    if (!room || !me || room.status !== "question") return;
    setBuzzing(true);
    await supabase.from("cerdas_cermat_buzzes").insert({
      room_id: room.id,
      participant_id: me.id,
      question_index: room.current_question_index,
    });
    setBuzzing(false);
  };

  const currentQ = room && room.current_question_index >= 0 ? questions[room.current_question_index] : null;
  const currentBuzzes = useMemo(
    () =>
      room
        ? buzzes
            .filter((b) => b.question_index === room.current_question_index)
            .sort((a, b) => new Date(a.buzzed_at).getTime() - new Date(b.buzzed_at).getTime())
        : [],
    [buzzes, room]
  );
  const myBuzzPos = me ? currentBuzzes.findIndex((b) => b.participant_id === me.id) : -1;
  const ranking = useMemo(() => [...participants].sort((a, b) => b.skor - a.skor), [participants]);

  if (!room || !me) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" /> Cerdas Cermat
          </h2>
          <p className="text-muted-foreground">Bergabung ke room cerdas cermat dari guru</p>
        </div>
        <Card className="p-8 shadow-card border-0 max-w-md mx-auto">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nama</label>
              <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama kamu" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Kode Room</label>
              <Input
                value={kode}
                onChange={(e) => setKode(e.target.value.toUpperCase())}
                placeholder="Contoh: ABC12"
                className="text-2xl font-bold tracking-widest text-center"
                maxLength={5}
              />
            </div>
            <Button className="w-full gradient-primary text-primary-foreground" size="lg" onClick={join} disabled={joining}>
              <Zap className="mr-2 h-4 w-4" /> Gabung Room
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const canBuzz = room.status === "question" && myBuzzPos === -1;
  const buzzLocked = room.status === "locked" || room.status === "revealed";

  return (
    <div className="space-y-6">
      <Card className="p-4 shadow-card border-0 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Room</p>
          <p className="font-display font-bold text-lg tracking-widest">{room.kode_room}</p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{participants.length} peserta</span>
        </div>
        <Badge variant="secondary">Skor kamu: {me.skor}</Badge>
        <Button variant="ghost" size="sm" onClick={leave}>
          <LogOut className="h-4 w-4 mr-1" /> Keluar
        </Button>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Question card */}
          <Card className="p-6 shadow-card border-0 min-h-[200px]">
            {room.status === "waiting" && (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-3 text-primary animate-pulse" />
                <p className="font-medium">Menunggu guru memulai...</p>
              </div>
            )}
            {room.status === "finished" && (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-xp" />
                <p className="font-bold text-xl">Sesi Selesai!</p>
                <p className="text-muted-foreground">Skor akhir kamu: {me.skor}</p>
              </div>
            )}
            {currentQ && room.status !== "waiting" && room.status !== "finished" && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">Soal {room.current_question_index + 1}</Badge>
                  <Badge className="gradient-badge text-primary-foreground border-0">{currentQ.kategori}</Badge>
                </div>
                <h3 className="text-xl font-semibold mb-4">{currentQ.pertanyaan}</h3>
                <div className="grid sm:grid-cols-2 gap-2">
                  {currentQ.pilihan.map((opt, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border-2 ${
                        room.status === "revealed" && i === currentQ.jawaban_benar
                          ? "border-success bg-success/10"
                          : "border-border"
                      }`}
                    >
                      <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </div>
                  ))}
                </div>
                {room.status === "revealed" && (
                  <div className="mt-4 rounded-lg bg-success/10 border border-success p-4 text-success">
                    <p className="font-semibold">Jawaban benar:</p>
                    <p>{String.fromCharCode(65 + currentQ.jawaban_benar)}. {currentQ.pilihan[currentQ.jawaban_benar]}</p>
                  </div>
                )}
              </>
            )}
          </Card>

          {/* Buzz button */}
          <Card className="p-6 shadow-card border-0 text-center">
            {myBuzzPos >= 0 ? (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Kamu di urutan</p>
                <p className="text-5xl font-display font-bold text-primary">#{myBuzzPos + 1}</p>
                {myBuzzPos === 0 && <p className="mt-2 font-semibold text-success">Kamu tercepat! 🎉</p>}
              </div>
            ) : (
              <Button
                size="lg"
                onClick={buzz}
                disabled={!canBuzz || buzzing}
                className={`w-full h-32 text-2xl font-bold ${
                  canBuzz ? "gradient-primary text-primary-foreground hover:scale-105 transition-transform" : ""
                }`}
              >
                <Hand className="h-10 w-10 mr-3" />
                {buzzLocked ? "Terkunci" : canBuzz ? "ANGKAT TANGAN!" : "Tunggu soal..."}
              </Button>
            )}
          </Card>

          {/* Current buzz queue */}
          {currentBuzzes.length > 0 && (
            <Card className="p-4 shadow-card border-0">
              <h4 className="font-semibold mb-2 text-sm">Antrian Buzz</h4>
              <div className="space-y-1">
                {currentBuzzes.map((b, idx) => {
                  const p = participants.find((x) => x.id === b.participant_id);
                  return (
                    <div
                      key={b.id}
                      className={`flex items-center gap-2 text-sm p-2 rounded ${
                        p?.id === me.id ? "bg-primary/10 font-semibold" : ""
                      }`}
                    >
                      <span className="font-bold w-6">{idx + 1}.</span>
                      <span>{p?.nama ?? "?"}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Leaderboard */}
        <Card className="p-5 shadow-card border-0 h-fit">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-xp" /> Peringkat
          </h4>
          <div className="space-y-2">
            {ranking.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  p.id === me.id ? "bg-primary/10 border border-primary" : "bg-muted"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`font-bold w-6 ${i === 0 ? "text-xp" : ""}`}>#{i + 1}</span>
                  <span className="text-sm">{p.nama}</span>
                </div>
                <Badge variant="secondary">{p.skor}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Podium Dialog */}
      <Dialog open={room?.status === "finished"} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Cerdas Cermat Selesai!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {ranking.slice(0, 3).map((participant, index) => (
              <div key={participant.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                  }`}>
                    {index === 0 ? <Crown className="h-6 w-6" /> : 
                     index === 1 ? <Medal className="h-6 w-6" /> : 
                     <Award className="h-6 w-6" />}
                  </div>
                  <div>
                    <p className="font-semibold">{participant.nama}</p>
                    <p className="text-sm text-muted-foreground">Peringkat {index + 1}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{participant.skor}</p>
                  <p className="text-xs text-muted-foreground">poin</p>
                </div>
              </div>
            ))}
            {ranking.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Belum ada peserta</p>
              </div>
            )}
          </div>
              <div className="flex justify-center mt-6">
                <Button onClick={() => { navigate('/murid'); }} className="gradient-primary text-primary-foreground">
                  Kembali ke Beranda
                </Button>
              </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
