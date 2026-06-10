# New-signup email alert — setup runbook (LEN-247)

Emails **stephengowa@gmail.com** for every new `profiles` row (🟡 pending stranger /
🟢 approved invite). Function code: `functions/notify-new-signup/index.ts`.

Flow: `profiles` INSERT → Supabase **Database Webhook** (sends `x-webhook-secret`) →
Edge Function `notify-new-signup` (`verify_jwt = false`) → **Resend** → your inbox.

All steps below are in the Supabase + Resend dashboards — no CLI needed.

---

## 1. Resend — get an API key (~3 min)
1. Sign in at https://resend.com (use **stephengowa@gmail.com** — see note ★).
2. **API Keys → Create API Key** (Sending access). Copy it (starts `re_…`).

★ **Zero-DNS fast path:** with no verified domain, Resend sends from
`onboarding@resend.dev` and only delivers to the email that owns the Resend account.
Since the alert goes to your own gmail, make sure the Resend account is that gmail and
it works immediately. (Later, to send from `alerts@lendpaper.com`: Resend → Domains →
add `lendpaper.com` → add the DNS records → set `ALERT_FROM` secret to
`LendPaper <alerts@lendpaper.com>`.)

## 2. Deploy the Edge Function (~5 min)
Supabase Dashboard → **Edge Functions → Deploy a new function** (or "Create function"):
1. Name it exactly **`notify-new-signup`**.
2. Paste the entire contents of `functions/notify-new-signup/index.ts`.
3. **Turn OFF "Verify JWT"** (this caller is a webhook, not a logged-in user).
4. Deploy. Note the function URL:
   `https://arpquyoucdsdmbetgftj.supabase.co/functions/v1/notify-new-signup`

## 3. Set the function secrets (~2 min)
First generate a random secret locally (don't commit it anywhere):
```bash
openssl rand -hex 24
```
Then Edge Functions → **Secrets** (a.k.a. Manage secrets) → add:
| Name | Value |
|---|---|
| `RESEND_API_KEY` | the `re_…` key from step 1 |
| `WEBHOOK_SECRET` | the random string you just generated |

(Optional: `ALERT_TO`, `ALERT_FROM` to override the defaults.)

## 4. Create the Database Webhook (~3 min)
Supabase Dashboard → **Database → Webhooks → Create a new hook**:
- **Table:** `public.profiles`
- **Events:** ✅ Insert (leave Update/Delete unchecked)
- **Type:** Supabase Edge Function → **`notify-new-signup`** (method POST)
- **HTTP Headers → Add header:**
  `x-webhook-secret` = the same `WEBHOOK_SECRET` value from step 3
- Save.

## 5. Test (~3 min)
**Option A — real:** sign up with a throwaway gmail (organic path → `pending`). A 🟡
email should land within seconds.

**Option B — curl smoke test** (paste your real `WEBHOOK_SECRET` from step 3):
```bash
SECRET=<paste-your-WEBHOOK_SECRET-here>
URL=https://arpquyoucdsdmbetgftj.supabase.co/functions/v1/notify-new-signup

# pending stranger -> expect 🟡 email
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$URL" \
  -H "Content-Type: application/json" -H "x-webhook-secret: $SECRET" \
  -d '{"type":"INSERT","table":"profiles","record":{"id":"test-1","email":"jane@gmail.com","full_name":"Jane Tester","company":null,"status":"pending","linkedin_url":"https://linkedin.com/in/jane","created_at":"2026-06-10T14:00:00Z"}}'

# invited approved -> expect 🟢 email
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$URL" \
  -H "Content-Type: application/json" -H "x-webhook-secret: $SECRET" \
  -d '{"type":"INSERT","table":"profiles","record":{"id":"test-2","email":"clint@peacsolutions.com","full_name":"Clint Morgan","company":"PEAC","status":"approved","role":"placement","created_at":"2026-06-10T14:00:00Z"}}'

# wrong secret -> expect 401 (no email)
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$URL" \
  -H "Content-Type: application/json" -H "x-webhook-secret: nope" -d '{}'
```
Both real POSTs should return `200` and deliver an email; the bad-secret one returns
`401`. Check **Edge Functions → Logs** if anything is missing.

---

## Notes
- Fires once per insert (both onboarding paths: organic `pending`, invited `approved`).
- Secrets live only in Supabase — never commit `RESEND_API_KEY`.
- SMS/Twilio is a separate follow-up (extends this same function).
