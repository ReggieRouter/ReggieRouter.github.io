// send-email — manual admin email sends from the lp-panel Members tab (LEN-58).
//
// Caller: lp-panel.html via sb.functions.invoke('send-email', { body: { to, subject, text } })
//
// Auth model (two layers):
//   1. Deployed with verify_jwt = true (the default) — the gateway rejects calls
//      without a valid Supabase JWT before this code even runs.
//   2. We resolve the JWT to a user and require their profiles.is_admin = true.
//      Everyone else gets a 403. This is an admin-only relay, full stop.
//
// Send: Resend (https://api.resend.com/emails). Plain text only in v1 — no html,
// single recipient, subject <= 200 chars, body <= 10k chars.
//
// Required function secret (Supabase Dashboard -> Edge Functions -> Secrets):
//   RESEND_API_KEY — Resend API key. Missing -> { error: "not_configured" } so the
//                    panel can fall back to mailto (feature is inert until set).
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected
// automatically into every Edge Function — never set those by hand.
//
// Conventions follow ../notify-new-signup/index.ts (no imports, plain fetch).

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const FROM = "Steve at LendPaper <hello@lendpaper.com>";
const MAX_SUBJECT = 200;
const MAX_TEXT = 10_000;

// Browser callers (lp-panel) need CORS; sb.functions.invoke sends these headers.
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // ── Layer 2 auth: resolve the caller's JWT to a user via GoTrue. ──────────
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401);

  const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: ANON_KEY },
  });
  if (!userResp.ok) return json({ error: "unauthorized" }, 401);
  const user: { id?: string; email?: string } = await userResp.json();
  if (!user?.id) return json({ error: "unauthorized" }, 401);

  // ── Admin gate: profiles.is_admin must be true (service key bypasses RLS). ──
  const profResp = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=is_admin`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
  );
  const profiles: Array<{ is_admin?: boolean }> = profResp.ok ? await profResp.json() : [];
  if (profiles?.[0]?.is_admin !== true) return json({ error: "forbidden" }, 403);

  // ── Validate the payload: one recipient, plain text, sane lengths. ────────
  let body: { to?: unknown; subject?: unknown; text?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }

  const to = typeof body.to === "string" ? body.to.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const text = typeof body.text === "string" ? body.text : "";

  // Single recipient only — the character class rejects comma/semicolon lists.
  if (!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(to)) {
    return json({ error: "invalid_to", detail: "one valid email address required" }, 400);
  }
  if (!subject || subject.length > MAX_SUBJECT) {
    return json({ error: "invalid_subject", detail: `1-${MAX_SUBJECT} chars` }, 400);
  }
  if (!text.trim() || text.length > MAX_TEXT) {
    return json({ error: "invalid_text", detail: `1-${MAX_TEXT} chars, plain text` }, 400);
  }

  if (!RESEND_API_KEY) return json({ error: "not_configured" }, 503);

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, text }),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    console.error("Resend send failed", resp.status, detail);
    // Pass Resend's status through so the panel can show what actually happened.
    return json({ error: "resend_error", status: resp.status, detail }, resp.status);
  }

  const result: { id?: string } = await resp.json().catch(() => ({}));
  console.log(`Email sent to ${to} by ${user.email ?? user.id} (resend id ${result?.id ?? "?"})`);
  return json({ ok: true, id: result?.id ?? null });
});
