CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  nama TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'guru', 'murid')),
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.materi (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  guru_id TEXT NOT NULL,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  konten TEXT DEFAULT '',
  topik TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  file_url TEXT,
  file_name TEXT,
  file_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quiz (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  guru_id TEXT NOT NULL,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  topik TEXT NOT NULL,
  total_soal INTEGER NOT NULL DEFAULT 0,
  durasi_menit INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  quiz_id TEXT NOT NULL REFERENCES public.quiz(id) ON DELETE CASCADE,
  pertanyaan TEXT NOT NULL,
  pilihan JSONB NOT NULL,
  jawaban_benar INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_progress (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  murid_id TEXT NOT NULL,
  materi_id TEXT NOT NULL REFERENCES public.materi(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not-started',
  progres_persen INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quiz_scores (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  murid_id TEXT NOT NULL,
  quiz_id TEXT NOT NULL REFERENCES public.quiz(id) ON DELETE CASCADE,
  skor INTEGER NOT NULL DEFAULT 0,
  total_benar INTEGER NOT NULL DEFAULT 0,
  total_soal INTEGER NOT NULL DEFAULT 0,
  waktu_pengerjaan_detik INTEGER,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.materi
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_path TEXT;

ALTER TABLE public.materi
  ALTER COLUMN konten DROP NOT NULL,
  ALTER COLUMN konten SET DEFAULT '';

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('materi_files', 'materi_files', true),
  ('quiz_files', 'quiz_files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_scores ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  table_name TEXT;
  policy_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['users', 'materi', 'quiz', 'quiz_questions', 'student_progress', 'quiz_scores']
  LOOP
    policy_name := 'public read ' || table_name;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = table_name AND policyname = policy_name) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (true)', policy_name, table_name);
    END IF;

    policy_name := 'public insert ' || table_name;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = table_name AND policyname = policy_name) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (true)', policy_name, table_name);
    END IF;

    policy_name := 'public update ' || table_name;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = table_name AND policyname = policy_name) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE USING (true) WITH CHECK (true)', policy_name, table_name);
    END IF;

    policy_name := 'public delete ' || table_name;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = table_name AND policyname = policy_name) THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE USING (true)', policy_name, table_name);
    END IF;
  END LOOP;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'public read app files') THEN
    CREATE POLICY "public read app files" ON storage.objects FOR SELECT USING (bucket_id IN ('materi_files', 'quiz_files'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'public upload app files') THEN
    CREATE POLICY "public upload app files" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('materi_files', 'quiz_files'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'public update app files') THEN
    CREATE POLICY "public update app files" ON storage.objects FOR UPDATE USING (bucket_id IN ('materi_files', 'quiz_files')) WITH CHECK (bucket_id IN ('materi_files', 'quiz_files'));
  END IF;
END $$;

INSERT INTO public.users (id, email, password, nama, role)
VALUES
  ('1', 'guru@demo.com', 'demo', 'Pak Budi', 'guru'),
  ('2', 'murid@demo.com', 'demo', 'Andi Pratama', 'murid'),
  ('3', 'admin@demo.com', 'demo', 'Administrator', 'admin')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  nama = EXCLUDED.nama,
  role = EXCLUDED.role;

INSERT INTO public.quiz (id, guru_id, judul, deskripsi, topik, total_soal, durasi_menit)
VALUES
  ('seed-quiz-pemrograman', '1', 'Quiz Pengertian Pemrograman', 'Dasar pengertian pemrograman dan algoritma', 'Pengertian Pemrograman', 2, 20),
  ('seed-quiz-python', '1', 'Quiz Pengenalan Python', 'Dasar sintaks dan konsep awal Python', 'Pengenalan Python', 2, 20)
ON CONFLICT (id) DO UPDATE SET
  judul = EXCLUDED.judul,
  deskripsi = EXCLUDED.deskripsi,
  topik = EXCLUDED.topik,
  total_soal = EXCLUDED.total_soal,
  durasi_menit = EXCLUDED.durasi_menit;

INSERT INTO public.quiz_questions (quiz_id, pertanyaan, pilihan, jawaban_benar)
SELECT 'seed-quiz-pemrograman', 'Apa yang dimaksud dengan pemrograman?', '["Proses menulis instruksi untuk komputer","Menggambar poster","Memperbaiki kabel","Menyalakan monitor"]'::jsonb, 0
WHERE NOT EXISTS (SELECT 1 FROM public.quiz_questions WHERE quiz_id = 'seed-quiz-pemrograman' AND pertanyaan = 'Apa yang dimaksud dengan pemrograman?');

INSERT INTO public.quiz_questions (quiz_id, pertanyaan, pilihan, jawaban_benar)
SELECT 'seed-quiz-pemrograman', 'Langkah-langkah berurutan untuk menyelesaikan masalah disebut?', '["Variabel","Algoritma","Bug","Folder"]'::jsonb, 1
WHERE NOT EXISTS (SELECT 1 FROM public.quiz_questions WHERE quiz_id = 'seed-quiz-pemrograman' AND pertanyaan = 'Langkah-langkah berurutan untuk menyelesaikan masalah disebut?');

INSERT INTO public.quiz_questions (quiz_id, pertanyaan, pilihan, jawaban_benar)
SELECT 'seed-quiz-python', 'Ekstensi file Python adalah?', '[".python",".py",".pyt",".docx"]'::jsonb, 1
WHERE NOT EXISTS (SELECT 1 FROM public.quiz_questions WHERE quiz_id = 'seed-quiz-python' AND pertanyaan = 'Ekstensi file Python adalah?');

INSERT INTO public.quiz_questions (quiz_id, pertanyaan, pilihan, jawaban_benar)
SELECT 'seed-quiz-python', 'Perintah untuk menampilkan teks di Python adalah?', '["echo()","display()","print()","show()"]'::jsonb, 2
WHERE NOT EXISTS (SELECT 1 FROM public.quiz_questions WHERE quiz_id = 'seed-quiz-python' AND pertanyaan = 'Perintah untuk menampilkan teks di Python adalah?');

NOTIFY pgrst, 'reload schema';
