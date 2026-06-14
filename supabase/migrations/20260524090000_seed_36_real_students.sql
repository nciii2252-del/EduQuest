WITH siswa(nomor, nama, email, password) AS (
  VALUES
    (1, 'Siswa 01', 'siswa01@sekolah.local', 'Siswa2026'),
    (2, 'Siswa 02', 'siswa02@sekolah.local', 'Siswa2026'),
    (3, 'Siswa 03', 'siswa03@sekolah.local', 'Siswa2026'),
    (4, 'Siswa 04', 'siswa04@sekolah.local', 'Siswa2026'),
    (5, 'Siswa 05', 'siswa05@sekolah.local', 'Siswa2026'),
    (6, 'Siswa 06', 'siswa06@sekolah.local', 'Siswa2026'),
    (7, 'Siswa 07', 'siswa07@sekolah.local', 'Siswa2026'),
    (8, 'Siswa 08', 'siswa08@sekolah.local', 'Siswa2026'),
    (9, 'Siswa 09', 'siswa09@sekolah.local', 'Siswa2026'),
    (10, 'Siswa 10', 'siswa10@sekolah.local', 'Siswa2026'),
    (11, 'Siswa 11', 'siswa11@sekolah.local', 'Siswa2026'),
    (12, 'Siswa 12', 'siswa12@sekolah.local', 'Siswa2026'),
    (13, 'Siswa 13', 'siswa13@sekolah.local', 'Siswa2026'),
    (14, 'Siswa 14', 'siswa14@sekolah.local', 'Siswa2026'),
    (15, 'Siswa 15', 'siswa15@sekolah.local', 'Siswa2026'),
    (16, 'Siswa 16', 'siswa16@sekolah.local', 'Siswa2026'),
    (17, 'Siswa 17', 'siswa17@sekolah.local', 'Siswa2026'),
    (18, 'Siswa 18', 'siswa18@sekolah.local', 'Siswa2026'),
    (19, 'Siswa 19', 'siswa19@sekolah.local', 'Siswa2026'),
    (20, 'Siswa 20', 'siswa20@sekolah.local', 'Siswa2026'),
    (21, 'Siswa 21', 'siswa21@sekolah.local', 'Siswa2026'),
    (22, 'Siswa 22', 'siswa22@sekolah.local', 'Siswa2026'),
    (23, 'Siswa 23', 'siswa23@sekolah.local', 'Siswa2026'),
    (24, 'Siswa 24', 'siswa24@sekolah.local', 'Siswa2026'),
    (25, 'Siswa 25', 'siswa25@sekolah.local', 'Siswa2026'),
    (26, 'Siswa 26', 'siswa26@sekolah.local', 'Siswa2026'),
    (27, 'Siswa 27', 'siswa27@sekolah.local', 'Siswa2026'),
    (28, 'Siswa 28', 'siswa28@sekolah.local', 'Siswa2026'),
    (29, 'Siswa 29', 'siswa29@sekolah.local', 'Siswa2026'),
    (30, 'Siswa 30', 'siswa30@sekolah.local', 'Siswa2026'),
    (31, 'Siswa 31', 'siswa31@sekolah.local', 'Siswa2026'),
    (32, 'Siswa 32', 'siswa32@sekolah.local', 'Siswa2026'),
    (33, 'Siswa 33', 'siswa33@sekolah.local', 'Siswa2026'),
    (34, 'Siswa 34', 'siswa34@sekolah.local', 'Siswa2026'),
    (35, 'Siswa 35', 'siswa35@sekolah.local', 'Siswa2026'),
    (36, 'Siswa 36', 'siswa36@sekolah.local', 'Siswa2026')
),
upserted AS (
  INSERT INTO public.users (email, password, nama, role, xp, level, streak)
  SELECT email, password, nama, 'murid', 0, 1, 0
  FROM siswa
  ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    nama = EXCLUDED.nama,
    role = 'murid',
    xp = 0,
    level = 1,
    streak = 0,
    updated_at = now()
  RETURNING id, email
)
DELETE FROM public.student_progress
WHERE murid_id IN (SELECT id FROM upserted);

WITH siswa(email) AS (
  VALUES
    ('siswa01@sekolah.local'), ('siswa02@sekolah.local'), ('siswa03@sekolah.local'),
    ('siswa04@sekolah.local'), ('siswa05@sekolah.local'), ('siswa06@sekolah.local'),
    ('siswa07@sekolah.local'), ('siswa08@sekolah.local'), ('siswa09@sekolah.local'),
    ('siswa10@sekolah.local'), ('siswa11@sekolah.local'), ('siswa12@sekolah.local'),
    ('siswa13@sekolah.local'), ('siswa14@sekolah.local'), ('siswa15@sekolah.local'),
    ('siswa16@sekolah.local'), ('siswa17@sekolah.local'), ('siswa18@sekolah.local'),
    ('siswa19@sekolah.local'), ('siswa20@sekolah.local'), ('siswa21@sekolah.local'),
    ('siswa22@sekolah.local'), ('siswa23@sekolah.local'), ('siswa24@sekolah.local'),
    ('siswa25@sekolah.local'), ('siswa26@sekolah.local'), ('siswa27@sekolah.local'),
    ('siswa28@sekolah.local'), ('siswa29@sekolah.local'), ('siswa30@sekolah.local'),
    ('siswa31@sekolah.local'), ('siswa32@sekolah.local'), ('siswa33@sekolah.local'),
    ('siswa34@sekolah.local'), ('siswa35@sekolah.local'), ('siswa36@sekolah.local')
)
DELETE FROM public.quiz_scores
WHERE murid_id IN (
  SELECT id FROM public.users WHERE email IN (SELECT email FROM siswa)
);

NOTIFY pgrst, 'reload schema';
