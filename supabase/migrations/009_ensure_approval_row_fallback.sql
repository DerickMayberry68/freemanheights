-- Ensure the signup trigger exists (idempotent re-creation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_approvals (user_id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Safety-net RPC: callable from the client after signup to guarantee the
-- approval row exists even if the trigger was missing or failed silently.
-- Only inserts if the user_id actually exists in auth.users.
CREATE OR REPLACE FUNCTION public.ensure_approval_exists(p_user_id UUID, p_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN;
  END IF;
  INSERT INTO admin_approvals (user_id, email)
  VALUES (p_user_id, p_email)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_approval_exists(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_approval_exists(UUID, TEXT) TO anon;
