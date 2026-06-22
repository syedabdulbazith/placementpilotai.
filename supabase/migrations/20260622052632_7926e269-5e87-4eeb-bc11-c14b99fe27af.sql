
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resume_analyses TO authenticated;
GRANT ALL ON public.resume_analyses TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.skill_assessments TO authenticated;
GRANT ALL ON public.skill_assessments TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.eligibility_checks TO authenticated;
GRANT ALL ON public.eligibility_checks TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_sessions TO authenticated;
GRANT ALL ON public.interview_sessions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.roadmaps TO authenticated;
GRANT ALL ON public.roadmaps TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_threads TO authenticated;
GRANT ALL ON public.chat_threads TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
