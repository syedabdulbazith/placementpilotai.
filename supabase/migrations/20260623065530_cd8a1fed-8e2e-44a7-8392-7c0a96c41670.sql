DROP POLICY IF EXISTS "admins read all resumes" ON public.resume_analyses;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;