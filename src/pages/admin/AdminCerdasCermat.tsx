import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, Trophy, Plus, Minus, SkipForward, Eye, Play, Copy, Check, Users, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
};

type Participant = { id: string; nama: string; skor: number };
type Buzz = { id: string; participant_id: string; question_index: number; buzzed_at: string };

function genCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

export default function AdminCerdasCermat() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [buzzes, setBuzzes] = useState<Buzz[]>([]);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  // Load all rooms
  useEffect(() => {
    loadRooms();
    loadQuestions();
  }, []);

  const loadRooms = async () => {
    const { data } = await supabase
      .from("cerdas_cermat_rooms")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setRooms(data as Room[]);
  };

  const loadQuestions = async () => {
    const { data } = await supabase
      .from("cerdas_cermat_questions")
      .select("*");
    if (data) setQuestions(data as Question[]);
  };

  const loadRoomDetails = async (roomId: string) => {
    // Load participants
    const { data: parts } = await supabase
      .from("cerdas_cermat_participants")
      .select("*")
      .eq("room_id", roomId);
    if (parts) setParticipants(parts as Participant[]);

    // Load buzzes
    const { data: buzzData } = await supabase
      .from("cerdas_cermat_buzzes")
      .select("*")
      .eq("room_id", roomId);
    if (buzzData) setBuzzes(buzzData as Buzz[]);
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm("Yakin ingin menghapus room ini?")) return;

    await supabase.from("cerdas_cermat_rooms").delete().eq("id", roomId);
    await supabase.from("cerdas_cermat_participants").delete().eq("room_id", roomId);
    await supabase.from("cerdas_cermat_buzzes").delete().eq("room_id", roomId);

    toast({ title: "Room berhasil dihapus" });
    loadRooms();
    setSelectedRoom(null);
  };

  const resetRoom = async (roomId: string) => {
    await supabase
      .from("cerdas_cermat_rooms")
      .update({
        status: "waiting",
        current_question_index: -1,
        question_started_at: null
      })
      .eq("id", roomId);

    toast({ title: "Room berhasil direset" });
    loadRooms();
  };

  const statusColors = {
    waiting: "bg-yellow-500",
    question: "bg-blue-500",
    locked: "bg-orange-500",
    revealed: "bg-green-500",
    finished: "bg-gray-500"
  };

  const statusLabels = {
    waiting: "Menunggu",
    question: "Pertanyaan",
    locked: "Terkunci",
    revealed: "Terungkap",
    finished: "Selesai"
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Admin Cerdas Cermat</h2>
          <p className="text-muted-foreground">Kelola semua room cerdas cermat</p>
        </div>
        <Button onClick={loadRooms} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rooms List */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Daftar Room</h3>
          <div className="space-y-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedRoom?.id === room.id ? "border-primary bg-primary/5" : "hover:bg-muted"
                }`}
                onClick={() => {
                  setSelectedRoom(room);
                  loadRoomDetails(room.id);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{room.kode_room}</span>
                      <Badge className={statusColors[room.status]}>
                        {statusLabels[room.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{room.host_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetRoom(room.id);
                      }}
                    >
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRoom(room.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {rooms.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Belum ada room yang dibuat
              </p>
            )}
          </div>
        </Card>

        {/* Room Details */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Detail Room</h3>
          {selectedRoom ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Kode Room: {selectedRoom.kode_room}</h4>
                <p className="text-sm text-muted-foreground">Host: {selectedRoom.host_name}</p>
                <p className="text-sm text-muted-foreground">
                  Status: {statusLabels[selectedRoom.status]}
                </p>
                <p className="text-sm text-muted-foreground">
                  Pertanyaan ke: {selectedRoom.current_question_index + 1}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Peserta ({participants.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {participants.map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span>{p.nama}</span>
                      <Badge variant="secondary">{p.skor} pts</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Buzz History</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {buzzes.map((b) => {
                    const participant = participants.find(p => p.id === b.participant_id);
                    return (
                      <div key={b.id} className="text-sm p-2 bg-muted rounded">
                        {participant?.nama} - Q{b.question_index + 1} - {new Date(b.buzzed_at).toLocaleTimeString()}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Pilih room untuk melihat detail
            </p>
          )}
        </Card>
      </div>

      {/* Questions Bank */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Bank Soal ({questions.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questions.map((q) => (
            <div key={q.id} className="p-4 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline">{q.kategori}</Badge>
                <Badge variant="secondary">Jawaban: {q.pilihan[q.jawaban_benar]}</Badge>
              </div>
              <p className="font-medium mb-2">{q.pertanyaan}</p>
              <div className="space-y-1">
                {q.pilihan.map((opt, idx) => (
                  <div key={idx} className={`text-sm p-1 rounded ${
                    idx === q.jawaban_benar ? "bg-green-100 text-green-800" : ""
                  }`}>
                    {String.fromCharCode(65 + idx)}. {opt}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}