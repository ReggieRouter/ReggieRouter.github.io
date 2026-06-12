// plaid-create-link-token — step 1 of the stateless Plaid bank-autofill flow (LEN-343,
// P2 of markdowns/BANK_DATA.md §5).
//
// Caller: js/bank-autofill.js (behind the ?bankimport=1 flag) via plain fetch to
// /functions/v1/plaid-create-link-token with the user's Supabase JWT.
//
// Auth model:
//   1. Deployed with verify_jwt = true (the default) — the gateway rejects calls
//      without a valid Supabase JWT before this code even runs.
//   2. We resolve the JWT to a user via GoTrue. ANY signed-in user qualifies —
//      this is a user-facing tool, deliberately NOT admin-gated (unlike send-email).
//
// What it does: POSTs to Plaid /link/token/create and returns { link_token } so the
// client can open Plaid Link. The caller's Supabase user id becomes Plaid's
// client_user_id. Nothing is read from or written to the database.
//
// Required function secrets (Supabase Dashboard -> Edge Functions -> Secrets):
//   PLAID_CLIENT_ID — Plaid client id.
//   PLAID_SECRET    — Plaid secret for the environment below.
//   PLAID_ENV       — optional; "production" selects production.plaid.com, anything
//                     else (or unset) selects sandbox.plaid.com. Default: sandbox.
// Missing Plaid secrets -> { error: "not_configured" } 503 so the client can hide or
// soft-fail the connect link (feature is inert until Steve sets secrets post LEN-345).
// SUPABASE_URL / SUPABASE_ANON_KEY are injected automatically — never set by hand.
//
// Conventions follow ../send-email/index.ts (no imports, plain fetch, CORS).

const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID") ?? "";
const PLAID_SECRET = Deno.env.get("PLAID_SECRET") ?? "";
const PLAID_ENV = (Deno.env.get("PLAID_ENV") ?? "sandbox").toLowerCase();
const PLAID_HOST = PLAID_ENV === "production"
  ? "https://production.plaid.com"
  : "https://sandbox.plaid.com";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// Browser callers need CORS; fetch() from the calculators sends these headers.
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

  // ── Resolve the caller's JWT to a user via GoTrue (any signed-in user). ──
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401);

  const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: ANON_KEY },
  });
  if (!userResp.ok) return json({ error: "unauthorized" }, 401);
  const user: { id?: string } = await userResp.json();
  if (!user?.id) return json({ error: "unauthorized" }, 401);

  if (!PLAID_CLIENT_ID || !PLAID_SECRET) return json({ error: "not_configured" }, 503);

  // ── Create the link token (BANK_DATA.md §5: transactions, US). ──
  const resp = await fetch(`${PLAID_HOST}/link/token/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      client_name: "LendPaper",
      language: "en",
      country_codes: ["US"],
      products: ["transactions"],
      user: { client_user_id: user.id },
    }),
  });

  const result: { link_token?: string; expiration?: string; error_code?: string } =
    await resp.json().catch(() => ({}));

  if (!resp.ok || !result.link_token) {
    // Log the Plaid error code, never the request (it contains the secret).
    console.error("Plaid link/token/create failed", resp.status, result?.error_code ?? "?");
    return json({ error: "plaid_error", status: resp.status, code: result?.error_code ?? null }, 502);
  }

  return json({ link_token: result.link_token, expiration: result.expiration ?? null });
});
