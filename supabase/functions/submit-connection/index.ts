import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const allowedOrigins = new Set([
  "https://www.freemanheights.com",
  "https://freemanheights.com",
  "https://freemanheights.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
])

const connectionTypes = new Set([
  "first_time_guest",
  "returning_guest",
  "current_member",
  "membership_interest",
])

const preferredContacts = new Set(["email", "phone", "text", "none"])

const allowedInterests = new Set([
  "children",
  "students",
  "women",
  "men",
  "worship",
  "missions",
  "small_groups",
  "volunteering",
])

const allowedInformationRequests = new Set([
  "membership",
  "baptism",
  "salvation",
  "small_groups",
  "serving",
  "children",
  "students",
  "pastoral_contact",
])

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin) ? origin : "",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  }
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  origin: string | null,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      ...extraHeaders,
      "Content-Type": "application/json",
    },
  })
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null
  const cleaned = value.trim()
  if (!cleaned) return null
  return cleaned.slice(0, maxLength)
}

function cleanList(value: unknown, allowed: Set<string>) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((item) => typeof item === "string" && allowed.has(item)))]
}

function getRequestIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip")
    || req.headers.get("x-real-ip")
    || "unknown"
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest("SHA-256", bytes)
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin")

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405, origin)
  }

  if (origin && !allowedOrigins.has(origin)) {
    return jsonResponse({ error: "Origin not allowed." }, 403, origin)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Server configuration is incomplete." }, 500, origin)
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400, origin)
  }

  if (cleanText(body.website, 200)) {
    return jsonResponse({ success: true }, 200, origin)
  }

  const elapsedMs = Number(body.elapsedMs)
  if (!Number.isFinite(elapsedMs) || elapsedMs < 1200) {
    return jsonResponse({ error: "Please wait a moment and try again." }, 400, origin)
  }

  const connectionType = cleanText(body.connectionType, 50)
  const firstName = cleanText(body.firstName, 80)
  const lastName = cleanText(body.lastName, 80)
  const email = cleanText(body.email, 254)?.toLowerCase() || null
  const phone = cleanText(body.phone, 50)
  const preferredContact = cleanText(body.preferredContact, 20) || "email"

  if (!connectionType || !connectionTypes.has(connectionType)) {
    return jsonResponse({ error: "Choose how you are connected with Freeman Heights." }, 400, origin)
  }
  if (!firstName || !lastName) {
    return jsonResponse({ error: "First and last name are required." }, 400, origin)
  }
  if (!email && !phone) {
    return jsonResponse({ error: "Enter an email address or phone number." }, 400, origin)
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: "Enter a valid email address." }, 400, origin)
  }
  if (!preferredContacts.has(preferredContact)) {
    return jsonResponse({ error: "Choose a valid contact preference." }, 400, origin)
  }
  if (preferredContact === "email" && !email) {
    return jsonResponse({ error: "Email is required for email follow-up." }, 400, origin)
  }
  if ((preferredContact === "phone" || preferredContact === "text") && !phone) {
    return jsonResponse({ error: "A phone number is required for phone or text follow-up." }, 400, origin)
  }
  if (body.emailConsent === true && !email) {
    return jsonResponse({ error: "Enter an email address before opting into email." }, 400, origin)
  }
  if (body.textConsent === true && !phone) {
    return jsonResponse({ error: "Enter a phone number before opting into text messages." }, 400, origin)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const userAgent = cleanText(req.headers.get("user-agent"), 500)
  const fingerprint = await sha256(`${getRequestIp(req)}|${userAgent || "unknown"}`)
  const rateLimitStart = new Date(Date.now() - 10 * 60 * 1000).toISOString()

  const { count, error: rateError } = await adminClient
    .from("connection_submissions")
    .select("id", { count: "exact", head: true })
    .eq("submission_fingerprint", fingerprint)
    .gte("created_at", rateLimitStart)

  if (rateError) {
    console.error("Connection card rate-limit lookup failed:", rateError)
    return jsonResponse({ error: "Unable to submit right now. Please try again." }, 500, origin)
  }

  if ((count || 0) >= 3) {
    return jsonResponse(
      { error: "Too many submissions. Please wait a few minutes and try again." },
      429,
      origin,
      { "Retry-After": "600" },
    )
  }

  const { data: church, error: churchError } = await adminClient
    .from("churches")
    .select("id")
    .eq("name", "Freeman Heights Baptist Church")
    .eq("is_active", true)
    .maybeSingle()

  if (churchError || !church) {
    console.error("Connection card church lookup failed:", churchError)
    return jsonResponse({ error: "Unable to submit right now. Please try again." }, 500, origin)
  }

  const { data, error } = await adminClient
    .from("connection_submissions")
    .insert({
      church_id: church.id,
      connection_type: connectionType,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      preferred_contact: preferredContact,
      address_line1: cleanText(body.addressLine1, 160),
      city: cleanText(body.city, 100),
      state: cleanText(body.state, 50),
      postal_code: cleanText(body.postalCode, 20),
      household_notes: cleanText(body.householdNotes, 1000),
      ministry_interests: cleanList(body.ministryInterests, allowedInterests),
      information_requests: cleanList(body.informationRequests, allowedInformationRequests),
      prayer_request: cleanText(body.prayerRequest, 3000),
      email_consent: body.emailConsent === true,
      text_consent: body.textConsent === true,
      source: cleanText(body.source, 100) || "website",
      submission_fingerprint: fingerprint,
      submitted_user_agent: userAgent,
    })
    .select("id")
    .single()

  if (error) {
    console.error("Connection card insert failed:", error)
    return jsonResponse({ error: "Unable to submit right now. Please try again." }, 500, origin)
  }

  return jsonResponse({ success: true, id: data.id }, 201, origin)
})
