ALTER TABLE public.quiz REPLICA IDENTITY FULL;
ALTER TABLE public.quiz_questions REPLICA IDENTITY FULL;
ALTER TABLE public.quiz_scores REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'quiz'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'quiz_questions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_questions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'quiz_scores'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_scores;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
