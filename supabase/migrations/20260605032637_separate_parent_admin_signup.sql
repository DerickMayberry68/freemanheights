-- Parent accounts use Supabase Auth but should not enter the admin approval
-- queue. The account_type metadata is routing information only; authorization
-- continues to use database rows and RLS.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(new.raw_user_meta_data ->> 'account_type', 'admin') <> 'parent' THEN
    INSERT INTO public.admin_approvals (user_id, email)
    VALUES (new.id, new.email)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
