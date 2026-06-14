import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, Trophy, Plus, Minus, SkipForward, Eye, Play, Copy, Check, Users, Crown, Medal, Award } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { addStudentXp } from "@/services/analyticsService";

type Question = {
  id: string;
  pertanyaan: string;
  pilihan: string[];
  jawaban_benar: number;
  kategori: string;
};

type Room = {
  id: string;
  kode_room: string;
  status: "waiting" | "question" | "locked" | "revealed" | "finished";
  current_question_index: number;
  host_secret: string;
  host_name: string;
  question_started_at?: string | null;
};

type Participant = { id: string; nama: string; skor: number };
type Buzz = { id: string; participant_id: string; question_index: number; buzzed_at: string };

function genCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

type CerdasCermatHistory = {
  id: string;
  kode_room: string;
  host_name: string;
  created_at: string;
  winner_name: string;
  winner_score: number;
  total_participants: number;
};

export default function GuruCerdasCermat() {
  const { user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [buzzes, setBuzzes] = useState<Buzz[]>([]);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPodium, setShowPodium] = useState(false);
  const [history, setHistory] = useState<CerdasCermatHistory[]>([]);


  useEffect(() => {
    supabase.from("cerdas_cermat_questions").select("*").then(({ data }) => {
      if (data) setQuestions(data as any);
    });

    // Load history from database once user is available
    if (user?.nama) {
      loadHistory();
    }
  }, [user?.nama]);

  const loadHistory = async () => {
    try {
      // Get all finished rooms for this host
      const { data: rooms, error } = await supabase
        .from("cerdas_cermat_rooms")
        .select(`
          id,
          kode_room,
          host_name,
          created_at,
          cerdas_cermat_participants (
            skor,
            nama
          )
        `)
        .eq("host_name", user?.nama || "")
        .eq("status", "finished")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading history:", error);
        return;
      }

      if (rooms) {
        const historyData = rooms.map(room => {
          const participants = room.cerdas_cermat_participants as any[] || [];
          const sortedParticipants = participants.sort((a, b) => b.skor - a.skor);
          const winner = sortedParticipants[0];

          return {
            id: room.id,
            kode_room: room.kode_room,
            host_name: room.host_name,
            created_at: new Date(room.created_at).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            winner_name: winner?.nama || "Tidak ada pemenang",
            winner_score: winner?.skor || 0,
            total_participants: participants.length
          };
        });

        setHistory(historyData);
      }
    } catch (err) {
      console.error("Error loading history:", err);
    }
  };

  // Realtime subscriptions
  useEffect(() => {
    if (!room) return;

    const fetchAll = async () => {
      const [{ data: p, error: pErr }, { data: b, error: bErr }, { data: r, error: rErr }] = await Promise.all([
        supabase.from("cerdas_cermat_participants").select("*").eq("room_id", room.id).order("joined_at"),
        supabase.from("cerdas_cermat_buzzes").select("*").eq("room_id", room.id).order("buzzed_at"),
        supabase.from("cerdas_cermat_rooms").select("*").eq("id", room.id).single(),
      ]);

      if (pErr || bErr || rErr) {
        console.error("Guru Cerdas Cermat fetch error", pErr || bErr || rErr);
      }

      if (p) setParticipants(p as any);
      if (b) setBuzzes(b as any);
      if (r) setRoom(r as any);
    };

    fetchAll();
    const interval = window.setInterval(fetchAll, 3000);

    const ch = supabase
      .channel(`room-${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cerdas_cermat_participants", filter: `room_id=eq.${room.id}` }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "cerdas_cermat_buzzes", filter: `room_id=eq.${room.id}` }, () => fetchAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "cerdas_cermat_rooms", filter: `id=eq.${room.id}` }, () => fetchAll())
      .subscribe();
    return () => {
      window.clearInterval(interval);
      supabase.removeChannel(ch);
    };
  }, [room?.id]);

  const createRoom = async () => {
    setCreating(true);
    const kode = genCode();
    const secret = crypto.randomUUID();
    const { data, error } = await supabase
      .from("cerdas_cermat_rooms")
      .insert({
        kode_room: kode,
        host_name: user?.nama ?? "Guru",
        host_secret: secret,
        status: "waiting",
        current_question_index: -1,
      })
      .select()
      .single();
    setCreating(false);
    if (error || !data) {
      toast({ title: "Gagal membuat room", description: error?.message, variant: "destructive" });
      return;
    }
    setRoom(data as any);
    toast({ title: "Room dibuat!", description: `Kode: ${kode}` });
  };

  const updateRoom = async (patch: Record<string, any>) => {
    if (!room) return;
    const { data, error } = await supabase
      .from("cerdas_cermat_rooms")
      .update(patch as any)
      .eq("id", room.id)
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return null;
    }

    if (data) {
      setRoom(data as any);
    }
    return data;
  };

  const nextQuestion = async () => {
    if (!room) return;
    if (questions.length === 0) {
      toast({ title: "Tidak ada soal", description: "Tambahkan soal dulu sebelum memulai sesi." });
      return;
    }

    const next = room.current_question_index + 1;
    if (next >= questions.length) {
      await updateRoom({ status: "finished" });
      toast({ title: "Sesi selesai 🏆" });
      return;
    }

    const updatedRoom = await updateRoom({
      current_question_index: next,
      status: "question",
      question_started_at: new Date().toISOString() as any,
    });

    if (updatedRoom) {
      setRoom(updatedRoom as any);
    }
  };

  const reveal = () => updateRoom({ status: "revealed" });
  const lock = () => updateRoom({ status: "locked" });


  const adjustScore = async (participantId: string, delta: number) => {
    const p = participants.find((x) => x.id === participantId);
    if (!p) return;
    await supabase
      .from("cerdas_cermat_participants")
      .update({ skor: p.skor + delta })
      .eq("id", participantId);
  };

const endCerdasCermat = async () => {
    if (!room) return;
    await updateRoom({ status: "finished" });
    setShowPodium(true);
    toast({ title: "Cerdas Cermat telah diakhiri!" });
    
    // Award XP to participants (if matched to users)
    awardXpForRoom(room.id);

    // Reload history after ending session
    setTimeout(() => {
      loadHistory();
    }, 1000);
  };

  // Award XP to participants where a matching user exists (by name)
  const awardXpForRoom = async (roomId: string) => {
    try {
      const { data: participantsRows } = await supabase.from("cerdas_cermat_participants").select("*").eq("room_id", roomId);
      if (!participantsRows || participantsRows.length === 0) return;

      for (const p of participantsRows as any[]) {
        try {
          const { data: userRow } = await supabase.from("users").select("id").eq("nama", p.nama).eq("role", "murid").maybeSingle();
          if (userRow && userRow.id && (p.skor || 0) > 0) {
            await addStudentXp(userRow.id, p.skor || 0);
          }
        } catch (e) {
          console.error("Error awarding XP for participant", p, e);
        }
      }
    } catch (err) {
      console.error("Error fetching participants for XP award:", err);
    }
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
  const ranking = useMemo(
    () => [...participants].sort((a, b) => b.skor - a.skor),
    [participants]
  );

  const copyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.kode_room);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!room) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" /> Cerdas Cermat
          </h2>
          <p className="text-muted-foreground">Buat room dan undang murid untuk bertanding real-time</p>
        </div>

        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">Sesi Aktif</TabsTrigger>
            <TabsTrigger value="history">Riwayat</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-6">
            <Card className="p-8 shadow-card border-0 text-center">
              <Zap className="h-16 w-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Belum ada room aktif</h3>
              <p className="text-muted-foreground mb-6">Mulai sesi cerdas cermat baru dengan {questions.length} soal</p>
              <Button size="lg" className="gradient-primary text-primary-foreground" onClick={createRoom} disabled={creating || questions.length === 0}>
                <Play className="mr-2 h-4 w-4" /> Buat Room Baru
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="p-6 shadow-card border-0">
              <h3 className="font-display font-semibold text-lg mb-4">Riwayat Cerdas Cermat</h3>
              {history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Trophy className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">Room {item.kode_room}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.created_at} • {item.total_participants} peserta
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-xp">{item.winner_name}</p>
                        <p className="text-sm text-muted-foreground">{item.winner_score} poin</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada riwayat cerdas cermat</p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-5 shadow-card border-0 gradient-primary text-primary-foreground">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm opacity-90">Kode Room</p>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-display font-bold tracking-widest">{room.kode_room}</span>
              <Button size="icon" variant="secondary" onClick={copyCode}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs opacity-75 mt-1">Bagikan kode ini kepada murid</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <Users className="h-5 w-5 mx-auto mb-1" />
              <p className="text-2xl font-bold">{participants.length}</p>
              <p className="text-xs opacity-75">Peserta</p>
            </div>
            <Badge variant="secondary" className="text-base">
              {room.status === "waiting" && "Menunggu"}
              {room.status === "question" && "Pertanyaan"}
              {room.status === "locked" && "Terkunci"}
              {room.status === "revealed" && "Terjawab"}
              {room.status === "finished" && "Selesai"}
            </Badge>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Question + controls */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6 shadow-card border-0">
            {currentQ ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">Soal {room.current_question_index + 1} / {questions.length}</Badge>
                  <Badge className="gradient-badge text-primary-foreground border-0">{currentQ.kategori}</Badge>
                </div>
                <h3 className="text-xl font-semibold mb-4">{currentQ.pertanyaan}</h3>
                <div className="grid sm:grid-cols-2 gap-2 mb-4">
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
<p>
                      {currentQ.jawaban_benar >= 0 && currentQ.jawaban_benar < currentQ.pilihan.length
                        ? `${String.fromCharCode(65 + currentQ.jawaban_benar)}. ${currentQ.pilihan[currentQ.jawaban_benar]}`
                        : "Jawaban benar tidak tersedia"}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Klik "Mulai Soal Berikutnya" untuk memulai</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-3 border-t">
              <Button onClick={nextQuestion} className="gradient-primary text-primary-foreground">
                <SkipForward className="mr-2 h-4 w-4" />
                {room.current_question_index < 0 ? "Mulai Soal Pertama" : "Soal Berikutnya"}
              </Button>
              {room.status === "question" && (
                <Button variant="outline" onClick={lock}>Kunci Buzz</Button>
              )}
              {(room.status === "question" || room.status === "locked") && (
                <Button variant="outline" onClick={reveal}>
                  <Eye className="mr-2 h-4 w-4" /> Tampilkan Jawaban
                </Button>
              )}
              <Button variant="destructive" onClick={endCerdasCermat} className="ml-auto">
                <Trophy className="mr-2 h-4 w-4" /> Akhiri Cerdas Cermat
              </Button>
            </div>
          </Card>

          {/* Buzz queue */}
          <Card className="p-5 shadow-card border-0">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Antrian Buzz
            </h4>
            {currentBuzzes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada yang mengacungkan tangan</p>
            ) : (
              <div className="space-y-2">
                {currentBuzzes.map((b, idx) => {
                  const p = participants.find((x) => x.id === b.participant_id);
                  if (!p) return null;
                  return (
                    <div
                      key={b.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        idx === 0 ? "bg-primary/10 border-2 border-primary" : "bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg w-6">{idx + 1}</span>
                        <span className="font-medium">{p.nama}</span>
                        {idx === 0 && <Badge className="gradient-xp text-xp-foreground border-0">Tercepat!</Badge>}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="text-success" onClick={() => adjustScore(p.id, 10)}>
                          <Plus className="h-3 w-3 mr-1" />10
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => adjustScore(p.id, -5)}>
                          <Minus className="h-3 w-3 mr-1" />5
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Leaderboard */}
        <Card className="p-5 shadow-card border-0 h-fit">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-xp" /> Peringkat
          </h4>
          {ranking.length === 0 ? (
            <p className="text-sm text-muted-foreground">Menunggu peserta...</p>
          ) : (
            <div className="space-y-2">
              {ranking.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold w-6 ${i === 0 ? "text-xp" : ""}`}>#{i + 1}</span>
                    <span className="text-sm">{p.nama}</span>
                  </div>
                  <Badge variant="secondary">{p.skor}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Podium Dialog */}
      <Dialog open={showPodium} onOpenChange={setShowPodium}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Pemenang Cerdas Cermat
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
