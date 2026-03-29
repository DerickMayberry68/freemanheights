-- Admin user profiles + filtered user listing for admin user management.
CREATE TABLE IF NOT EXISTS public.admin_user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  title TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_user_profiles ENABLE ROW LEVEL SECURITY;

-- Admins can list approved users with profile + auth status metadata.
CREATE OR REPLACE FUNCTION public.get_admin_users(p_status TEXT DEFAULT 'all')
RETURNS TABLE (
  approval_id UUID,
  user_id UUID,
  email TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  is_active BOOLEAN,
  full_name TEXT,
  phone TEXT,
  title TEXT,
  notes TEXT,
  email_confirmed_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_admin_role('admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_status NOT IN ('all', 'active', 'inactive') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be all, active, or inactive', p_status;
  END IF;

  RETURN QUERY
  SELECT
    a.id AS approval_id,
    a.user_id,
    a.email,
    a.role,
    a.created_at,
    a.approved_at,
    COALESCE(p.is_active, true) AS is_active,
    p.full_name,
    p.phone,
    p.title,
    p.notes,
    u.email_confirmed_at,
    u.last_sign_in_at
  FROM public.admin_approvals a
  LEFT JOIN public.admin_user_profiles p ON p.user_id = a.user_id
  LEFT JOIN auth.users u ON u.id = a.user_id
  WHERE a.approved = true
    AND (
      p_status = 'all'
      OR (p_status = 'active' AND COALESCE(p.is_active, true) = true)
      OR (p_status = 'inactive' AND COALESCE(p.is_active, true) = false)
    )
  ORDER BY a.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_users(TEXT) TO authenticated;

-- Admins can create/update profile details and active status.
CREATE OR REPLACE FUNCTION public.upsert_admin_user_profile(
  p_user_id UUID,
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT true
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_admin_role('admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.admin_approvals a
    WHERE a.user_id = p_user_id
      AND a.approved = true
  ) THEN
    RAISE EXCEPTION 'Approved user not found.';
  END IF;

  INSERT INTO public.admin_user_profiles (
    user_id,
    full_name,
    phone,
    title,
    notes,
    is_active,
    updated_at
  )
  VALUES (
    p_user_id,
    NULLIF(TRIM(p_full_name), ''),
    NULLIF(TRIM(p_phone), ''),
    NULLIF(TRIM(p_title), ''),
    NULLIF(TRIM(p_notes), ''),
    COALESCE(p_is_active, true),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
    SET
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      title = EXCLUDED.title,
      notes = EXCLUDED.notes,
      is_active = EXCLUDED.is_active,
      updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_admin_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
