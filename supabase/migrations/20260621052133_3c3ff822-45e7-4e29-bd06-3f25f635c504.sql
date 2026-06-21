-- Clean up any invalid roles before adding constraint
UPDATE public.chat_messages SET role = 'assistant' WHERE role NOT IN ('user','assistant');

ALTER TABLE public.chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_role_check;
ALTER TABLE public.chat_messages
  ADD CONSTRAINT chat_messages_role_check CHECK (role IN ('user','assistant'));

-- Revoke EXECUTE on SECURITY DEFINER helper functions from public roles.
-- has_role is called from RLS policies (which run as the table owner), so
-- revoking EXECUTE from authenticated/anon/public does not break policy use.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;