// notify-new-signup — emails the admin whenever a new row is inserted into `profiles`.
//
// Wiring (see ../notify_new_signup_webhook.md):
//   profiles INSERT
//     -> Supabase Database Webhook (sends header x-webhook-secret: <WEBHOOK_SECRET>)
//       -> this function (deploy with verify_jwt = false)
//         -> Resend -> ALERT_TO
//
// Fires for EVERY new signup (LEN-247). The email is labelled by status so Steve can tell
// an organic "pending" stranger apart from an invited "approved" member at a glance.
//
// Required function secrets (Supabase Dashboard -> Edge Functions -> Secrets):
//   RESEND_API_KEY  — Resend API key
//   WEBHOOK_SECRET  — random string; must match the x-webhook-secret header on the webhook
// Optional overrides:
//   ALERT_TO   (default stephengowa@gmail.com)
//   ALERT_FROM (default "LendPaper <onboarding@resend.dev>" — zero-DNS; swap to a verified
//               lendpaper.com address once the domain is verified in Resend)

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") ?? "";
const ALERT_TO = Deno.env.get("ALERT_TO") ?? "stephengowa@gmail.com";
const ALERT_FROM = Deno.env.get("ALERT_FROM") ?? "LendPaper <onboarding@resend.dev>";
const PANEL_URL = "https://lendpaper.com/lp-panel.html";

const esc = (s: unknown): string =>
  String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

interface ProfileRecord {
  id?: string;
  email?: string;
  full_name?: string;
  company?: string | null;
  status?: string;
  linkedin_url?: string | null;
  role?: string | null;
  created_at?: string;
}

function buildEmail(rec: ProfileRecord) {
  const approved = rec.status === "approved";
  const name = (rec.full_name || "").trim() || "(no name)";
  const dot = approved ? "🟢" : "🟡";
  const subject = approved
    ? `${dot} New LendPaper member — ${name} (invited, approved)`
    : `${dot} New LendPaper signup — ${name} (pending review)`;

  const li = (rec.linkedin_url || "").trim();
  const liHtml = li
    ? `<a href="${esc(li)}" style="color:#2D6A4F">${esc(li)}</a>`
    : `<span style="color:#9CA3AF">none provided</span>`;
  const company = (rec.company || "").trim() || "—";
  const statusLabel = approved
    ? "Approved (invited — already has access)"
    : "Pending review (organic — needs your approval)";

  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 14px 6px 0;color:#6B7280;font-size:13px;white-space:nowrap;vertical-align:top">${label}</td>` +
    `<td style="padding:6px 0;color:#111827;font-size:14px">${value}</td></tr>`;

  const html = `<!doctype html><html><body style="margin:0;background:#F8FAF7;font-family:-apple-system,Segoe UI,Inter,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:28px 22px">
    <div style="background:#fff;border:1px solid rgba(0,0,0,0.08);border-radius:14px;padding:26px 24px">
      <div style="font-size:15px;font-weight:700;color:#1A3C2E;margin-bottom:2px">lend<span style="color:#2D6A4F">paper</span>.</div>
      <h1 style="font-size:18px;line-height:1.3;margin:14px 0 4px;color:#111827">${dot} ${esc(name)} just ${approved ? "joined" : "requested access"}</h1>
      <p style="margin:0 0 18px;color:#6B7280;font-size:13px">${esc(statusLabel)}</p>
      <table style="border-collapse:collapse;width:100%">
        ${row("Name", esc(name))}
        ${row("Email", `<a href="mailto:${esc(rec.email)}" style="color:#2D6A4F">${esc(rec.email || "—")}</a>`)}
        ${row("Company", esc(company))}
        ${row("LinkedIn", liHtml)}
        ${rec.role ? row("Role / persona", esc(rec.role)) : ""}
        ${row("Status", esc(rec.status || "—"))}
        ${rec.created_at ? row("Signed up", esc(rec.created_at)) : ""}
      </table>
      <a href="${PANEL_URL}" style="display:inline-block;margin-top:22px;background:#1A3C2E;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;border-radius:9px">Review in Members panel →</a>
    </div>
    <p style="text-align:center;color:#9CA3AF;font-size:11px;margin-top:16px">Automated alert from LendPaper · new ${esc(rec.status || "signup")} in profiles</p>
  </div></body></html>`;

  return { subject, html };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  // Shared-secret gate — the webhook is the only caller; reject anything else.
  if (!WEBHOOK_SECRET || req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set");
    return new Response("Server not configured", { status: 500 });
  }

  let payload: { type?: string; table?: string; record?: ProfileRecord };
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  // Defensive: only act on INSERTs into profiles. (Webhook should be scoped to this anyway.)
  if (payload.type && payload.type !== "INSERT") {
    return new Response("Ignored (not an insert)", { status: 200 });
  }
  const rec = payload.record;
  if (!rec || !rec.id) {
    return new Response("Ignored (no record)", { status: 200 });
  }

  const { subject, html } = buildEmail(rec);

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: ALERT_FROM,
      to: [ALERT_TO],
      reply_to: rec.email || undefined,
      subject,
      html,
    }),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    console.error("Resend send failed", resp.status, detail);
    return new Response(`Resend error: ${resp.status}`, { status: 500 });
  }

  console.log(`Alert sent for ${rec.email} (${rec.status})`);
  return new Response("ok", { status: 200 });
});
