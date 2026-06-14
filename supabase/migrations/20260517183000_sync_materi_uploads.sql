CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.materi (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  guru_id TEXT NOT NULL,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  konten TEXT DEFAULT '',
  topik TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.materi
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_path TEXT;

ALTER TABLE public.materi
  ALTER COLUMN konten DROP NOT NULL,
  ALTER COLUMN konten SET DEFAULT '';

UPDATE public.materi
SET status = 'published'
WHERE status IS NULL OR status NOT IN ('published', 'draft');

INSERT INTO storage.buckets (id, name, public)
VALUES ('materi_files', 'materi_files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'public read materi files'
  ) THEN
    CREATE POLICY "public read materi files"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'materi_files');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'public upload materi files'
  ) THEN
    CREATE POLICY "public upload materi files"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'materi_files');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'public update materi files'
  ) THEN
    CREATE POLICY "public update materi files"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'materi_files')
    WITH CHECK (bucket_id = 'materi_files');
  END IF;
END $$;
