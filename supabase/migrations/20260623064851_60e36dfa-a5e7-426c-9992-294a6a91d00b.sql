DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['resume_analyses','skill_assessments','eligibility_checks','interview_sessions','roadmaps','chat_threads','chat_messages','profiles']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
  EXECUTE 'GRANT SELECT ON public.user_roles TO authenticated';
  EXECUTE 'GRANT ALL ON public.user_roles TO service_role';
END$$;