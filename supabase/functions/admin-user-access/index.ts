import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function getRequestIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return forwarded || req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || null
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const authorization = req.headers.get("Authorization")

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Server configuration is incomplete." }, 500)
  }

  if (!authorization?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Authentication required." }, 401)
  }

  const token = authorization.slice("Bearer ".length)
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: userData, error: userError } = await adminClient.auth.getUser(token)
  const caller = userData.user
  if (userError || !caller) {
    return jsonResponse({ error: "Invalid session." }, 401)
  }

  const { data: approval, error: approvalError } = await adminClient
    .from("admin_approvals")
    .select("user_id, email, approved, role")
    .eq("user_id", caller.id)
    .maybeSingle()

  if (approvalError) {
    console.error("Failed to load caller approval:", approvalError)
    return jsonResponse({ error: "Unable to verify admin access." }, 500)
  }

  const { data: profile, error: profileError } = await adminClient
    .from("admin_user_profiles")
    .select("is_active")
    .eq("user_id", caller.id)
    .maybeSingle()

  if (profileError) {
    console.error("Failed to load caller profile:", profileError)
    return jsonResponse({ error: "Unable to verify admin access." }, 500)
  }

  if (!approval?.approved || profile?.is_active === false) {
    return jsonResponse({ error: "Active admin access is required." }, 403)
  }

  let body: { action?: string; userId?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400)
  }

  if (body.action === "record-login") {
    const { error } = await adminClient.from("admin_login_logs").insert({
      user_id: caller.id,
      email: caller.email || approval.email,
      ip_address: getRequestIp(req),
      user_agent: req.headers.get("user-agent"),
    })

    if (error) {
      console.error("Failed to record admin login:", error)
      return jsonResponse({ error: "Unable to record login." }, 500)
    }

    return jsonResponse({ success: true })
  }

  if (body.action !== "delete-user") {
    return jsonResponse({ error: "Unknown action." }, 400)
  }

  if (approval.role !== "admin") {
    return jsonResponse({ error: "Administrator role is required." }, 403)
  }

  const targetUserId = body.userId
  if (!targetUserId) {
    return jsonResponse({ error: "A user ID is required." }, 400)
  }

  if (targetUserId === caller.id) {
    return jsonResponse({ error: "You cannot delete your own account." }, 400)
  }

  const { data: targetApproval, error: targetError } = await adminClient
    .from("admin_approvals")
    .select("user_id, role, approved")
    .eq("user_id", targetUserId)
    .maybeSingle()

  if (targetError) {
    console.error("Failed to load target user:", targetError)
    return jsonResponse({ error: "Unable to load the target user." }, 500)
  }

  if (!targetApproval) {
    return jsonResponse({ error: "User not found." }, 404)
  }

  const { data: targetAuthData, error: targetAuthError } = await adminClient.auth.admin
    .getUserById(targetUserId)

  if (targetAuthError || !targetAuthData.user) {
    const isMissingUser = targetAuthError?.message?.toLowerCase().includes("not found")
    if (!isMissingUser) {
      console.error("Failed to load target Auth user:", targetAuthError)
      return jsonResponse({ error: "Unable to load the target Auth account." }, 500)
    }

    const { error: orphanCleanupError } = await adminClient
      .from("admin_approvals")
      .delete()
      .eq("user_id", targetUserId)

    if (orphanCleanupError) {
      console.error("Failed to clean up orphaned approval:", orphanCleanupError)
      return jsonResponse({ error: "Unable to clean up the orphaned user record." }, 500)
    }

    return jsonResponse({ success: true, warning: "Orphaned user record removed." })
  }

  if (targetApproval.approved && targetApproval.role === "admin") {
    const { data: adminApprovals, error: adminsError } = await adminClient
      .from("admin_approvals")
      .select("user_id")
      .eq("approved", true)
      .eq("role", "admin")

    if (adminsError) {
      console.error("Failed to count administrators:", adminsError)
      return jsonResponse({ error: "Unable to verify administrator count." }, 500)
    }

    const { data: authUsersData, error: authUsersError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })

    if (authUsersError) {
      console.error("Failed to load Auth users:", authUsersError)
      return jsonResponse({ error: "Unable to verify administrator count." }, 500)
    }

    const authUserIds = new Set((authUsersData.users || []).map((user) => user.id))
    const adminIds = (adminApprovals || [])
      .map((row) => row.user_id)
      .filter((id) => authUserIds.has(id))
    const { data: adminProfiles, error: profilesError } = await adminClient
      .from("admin_user_profiles")
      .select("user_id, is_active")
      .in("user_id", adminIds)

    if (profilesError) {
      console.error("Failed to load administrator profiles:", profilesError)
      return jsonResponse({ error: "Unable to verify administrator count." }, 500)
    }

    const inactiveIds = new Set(
      (adminProfiles || []).filter((row) => row.is_active === false).map((row) => row.user_id),
    )
    const activeAdminCount = adminIds.filter((id) => !inactiveIds.has(id)).length

    if (activeAdminCount <= 1) {
      return jsonResponse({ error: "You cannot delete the last active administrator." }, 400)
    }
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId)
  if (deleteError) {
    console.error("Failed to delete Auth user:", deleteError)
    return jsonResponse({ error: deleteError.message || "Unable to delete user." }, 500)
  }

  const { error: cleanupError } = await adminClient
    .from("admin_approvals")
    .delete()
    .eq("user_id", targetUserId)

  if (cleanupError) {
    console.error("Auth user deleted but approval cleanup failed:", cleanupError)
    return jsonResponse({
      success: true,
      warning: "The Auth account was deleted, but its approval record needs cleanup.",
    })
  }

  return jsonResponse({ success: true })
})
