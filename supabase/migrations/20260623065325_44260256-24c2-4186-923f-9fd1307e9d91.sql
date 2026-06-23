CREATE TABLE IF NOT EXISTS public.resume_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_name TEXT,
  overall_score INT,
  ats_score INT,
  strengths TEXT[],
  weaknesses TEXT[],
  suggestions TEXT[],
  detected_skills TEXT[],
  summary TEXT,
  raw_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resume_analyses TO authenticated;
GRANT ALL ON public.resume_analyses TO service_role;

ALTER TABLE public.resume_analyses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'resume_analyses'
      AND policyname = 'own resume analyses'
  ) THEN
    CREATE POLICY "own resume analyses" ON public.resume_analyses
      FOR ALL TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'resume_analyses'
      AND policyname = 'admins read all resumes'
  ) THEN
    CREATE POLICY "admins read all resumes" ON public.resume_analyses
      FOR SELECT TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;