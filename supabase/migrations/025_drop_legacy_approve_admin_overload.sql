-- Remove legacy overload to prevent PostgREST RPC ambiguity (PGRST203)
-- Keep the newer signature:
--   public.approve_admin_user(p_approval_id UUID, p_role TEXT DEFAULT 'editor')
DROP FUNCTION IF EXISTS public.approve_admin_user(UUID);
