
-- Rooms
CREATE TABLE public.cerdas_cermat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kode_room TEXT NOT NULL UNIQUE,
  host_name TEXT NOT NULL,
  host_secret TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting | question | locked | revealed | finished
  current_question_index INTEGER NOT NULL DEFAULT -1,
  question_started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Participants
CREATE TABLE public.cerdas_cermat_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.cerdas_cermat_rooms(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  skor INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ccp_room ON public.cerdas_cermat_participants(room_id);

-- Buzzes
CREATE TABLE public.cerdas_cermat_buzzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.cerdas_cermat_rooms(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.cerdas_cermat_participants(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  buzzed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ccb_room_q ON public.cerdas_cermat_buzzes(room_id, question_index, buzzed_at);

-- Questions bank
CREATE TABLE public.cerdas_cermat_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pertanyaan TEXT NOT NULL,
  pilihan JSONB NOT NULL,
  jawaban_benar INTEGER NOT NULL,
  kategori TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cerdas_cermat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cerdas_cermat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cerdas_cermat_buzzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cerdas_cermat_questions ENABLE ROW LEVEL SECURITY;

-- Permissive policies (demo mode, no auth)
CREATE POLICY "public read rooms" ON public.cerdas_cermat_rooms FOR SELECT USING (true);
CREATE POLICY "public insert rooms" ON public.cerdas_cermat_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "public update rooms" ON public.cerdas_cermat_rooms FOR UPDATE USING (true);
CREATE POLICY "public delete rooms" ON public.cerdas_cermat_rooms FOR DELETE USING (true);

CREATE POLICY "public read parts" ON public.cerdas_cermat_participants FOR SELECT USING (true);
CREATE POLICY "public insert parts" ON public.cerdas_cermat_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "public update parts" ON public.cerdas_cermat_participants FOR UPDATE USING (true);
CREATE POLICY "public delete parts" ON public.cerdas_cermat_participants FOR DELETE USING (true);

CREATE POLICY "public read buzzes" ON public.cerdas_cermat_buzzes FOR SELECT USING (true);
CREATE POLICY "public insert buzzes" ON public.cerdas_cermat_buzzes FOR INSERT WITH CHECK (true);
CREATE POLICY "public delete buzzes" ON public.cerdas_cermat_buzzes FOR DELETE USING (true);

CREATE POLICY "public read questions" ON public.cerdas_cermat_questions FOR SELECT USING (true);

-- Realtime
ALTER TABLE public.cerdas_cermat_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.cerdas_cermat_participants REPLICA IDENTITY FULL;
ALTER TABLE public.cerdas_cermat_buzzes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cerdas_cermat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cerdas_cermat_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cerdas_cermat_buzzes;

-- Seed bank soal cerdas cermat (Pemrograman Dasar Python)
INSERT INTO public.cerdas_cermat_questions (pertanyaan, pilihan, jawaban_benar, kategori) VALUES
('Apa output dari: print(2 + 3 * 2)?', '["10","12","8","7"]'::jsonb, 3, 'Pengenalan Python'),
('Simbol apa untuk komentar satu baris di Python?', '["//","#","--","/*"]'::jsonb, 1, 'Pengenalan Python'),
('Tipe data dari nilai 3.14 di Python adalah?', '["int","str","float","bool"]'::jsonb, 2, 'Variabel Python'),
('Fungsi untuk menampilkan teks ke layar adalah?', '["echo()","print()","write()","show()"]'::jsonb, 1, 'Pengenalan Python'),
('Bahasa pemrograman yang menggunakan indentasi sebagai blok kode adalah?', '["Java","C++","Python","JavaScript"]'::jsonb, 2, 'Bahasa Pemrograman'),
('Pernyataan deklarasi variabel yang BENAR di Python adalah?', '["int x = 5","x := 5","x = 5","var x = 5"]'::jsonb, 2, 'Variabel Python'),
('Pemrograman adalah proses...?', '["Membuat desain grafis","Menulis instruksi untuk komputer","Memperbaiki hardware","Membuat jaringan"]'::jsonb, 1, 'Pengertian Pemrograman'),
('Ekstensi file untuk script Python adalah?', '[".pyt",".py",".python",".pys"]'::jsonb, 1, 'Pengenalan Python'),
('Hasil dari: type("123") di Python?', '["int","float","str","bool"]'::jsonb, 2, 'Variabel Python'),
('Bahasa pemrograman tingkat tinggi yang dikompilasi menjadi bytecode adalah?', '["Assembly","C","Python","Machine code"]'::jsonb, 2, 'Bahasa Pemrograman'),
('Operator pangkat di Python adalah?', '["^","**","pow","//"]'::jsonb, 1, 'Pengenalan Python'),
('Output dari: print(10 // 3)?', '["3.33","3","4","3.0"]'::jsonb, 1, 'Pengenalan Python');
