// plaid-exchange — step 2 of the stateless Plaid bank-autofill flow (LEN-343,
// P2 of markdowns/BANK_DATA.md §5).
//
// Caller: js/bank-autofill.js (behind the ?bankimport=1 flag) with body
// { public_token } after a successful Plaid Link session.
//
// ════════════════════════════════════════════════════════════════════════════
// STATELESSNESS CONTRACT (load-bearing — BANK_DATA.md §1/§5/§6, ratify in LEN-345)
//
//   This function stores NOTHING. No tokens, no transactions, no new tables.
//   - The public_token is exchanged for an access_token which lives ONLY in a
//     local variable for the lifetime of this single request; it is never
//     logged, never returned to the client, never written anywhere. When the
//     function returns, the token is gone and the Plaid Item is orphaned —
//     there is deliberately no way to re-pull this user's bank data later.
//   - Raw transactions are pulled into memory, aggregated into the derived
//     BankProfile (BANK_DATA.md §2), and discarded. Only derived metrics
//     leave this function, and they go to the requesting client only.
//   - No database reads or writes of any kind happen here (auth resolution
//     via GoTrue is the only Supabase call).
//   Persistent Items / refresh / monitoring = a separate future decision with
//   real compliance weight — do NOT add storage to this function casually.
// ════════════════════════════════════════════════════════════════════════════
//
// Auth model:
//   1. Deployed with verify_jwt = true (the default) — gateway-rejected without
//      a valid Supabase JWT.
//   2. JWT resolved to a user via GoTrue. ANY signed-in user — NOT admin-gated.
//
// Flow: /item/public_token/exchange -> /transactions/sync loop (~6 months kept)
//       -> /accounts/balance/get (+ best-effort institution name) -> BankProfile
//       computed server-side -> { bankProfile } returned.
//
// The BankProfile aggregation below is a faithful PORT of js/bank-import.js
// (LEN-342). The marked region is deliberately annotation-free JS so the parity
// test (tools/qa/verify-bank-profile-parity.js) can execute the exact same code
// in Node against the client parser's output. Keep both in sync.
//
// Required function secrets: PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV (optional,
// default sandbox). Missing -> { error: "not_configured" } 503.
// SUPABASE_URL / SUPABASE_ANON_KEY are injected automatically.
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

const MONTHS_BACK = 6; // BANK_DATA.md §5: pull ~6 months of transactions

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

// ─────────────────────────────────────────────────────────────────────────────
// AGGREGATION-PORT-BEGIN  (faithful port of js/bank-import.js — KEEP IN SYNC.
// Annotation-light on purpose: tools/qa/verify-bank-profile-parity.js extracts
// this exact region, runs it in Node (native type stripping), and asserts
// identical BankProfiles vs the client module on the same transactions.)
// ─────────────────────────────────────────────────────────────────────────────

/* Known funder names (BANK_DATA.md §2) — same curated list as js/bank-import.js. */
var FINANCING_NAMES = [
  'FORWARD FINANCING', 'ONDECK', 'ON DECK', 'KAPITUS', 'FUNDBOX',
  'CAN CAPITAL', 'RAPID FINANCE', 'CREDIBLY', 'EXPANSION CAPITAL',
  'MULLIGAN FUNDING', 'FORA FINANCIAL', 'BLUEVINE', 'FUNDING CIRCLE',
  'NATIONAL FUNDING', 'RELIANT FUNDING', 'QUICKBRIDGE', 'SBG FUNDING',
  'LIBERTAS', 'EVEREST BUSINESS FUNDING', 'GREENBOX CAPITAL',
  'PEARL CAPITAL', 'FUNDKITE', 'BYZFUNDER', 'WALL FUNDING',
  'VOX FUNDING', 'MANTIS FUNDING', 'TVT CAPITAL', 'VELOCITY CAPITAL',
  'BIZ2CREDIT', 'SMARTBIZ', 'LENDINGCLUB', 'SHOPIFY CAPITAL',
  'STRIPE CAPITAL', 'SQUARE CAPITAL', 'PAYPAL WORKING CAPITAL',
  'LENDISTRY', 'NEWTEK', 'BRITECAP', 'KALAMATA', 'BUSINESS BACKER',
  'GOKAPITAL', 'NATIONAL BUSINESS CAPITAL', 'KNIGHT CAPITAL',
  'WEBBANK', 'CELTIC BANK'
];
var FINANCING_GENERIC = /\b(LOAN PMT|LOAN PAYMENT|LN PYMT|LN PMT|MCA|MERCHANT CASH|DAILY ACH|CAPITAL ACH|ADVANCE PMT|RTR PMT)\b/;
var TRANSFER_RE = /\b(TRANSFER|XFER|ONLINE TFR|SWEEP|INTERNAL TFR)\b|ZELLE TO SELF/;
var NSF_RE = /\bNSF\b|INSUFFICIENT FUND|RETURNED ITEM|RETURN ITEM|OD FEE|OVERDRAFT/;

function monthKey(d: Date) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function isFinancingDesc(desc: string) {
  for (var i = 0; i < FINANCING_NAMES.length; i++) {
    if (desc.indexOf(FINANCING_NAMES[i]) >= 0) return true;
  }
  return FINANCING_GENERIC.test(desc);
}

/* txns: [{ date: Date, desc: UPPERCASE string, amount: +deposit/−debit,
   balance: running balance after the txn or null }] — same internal shape as
   the client parsers produce. */
function buildProfile(txns: any[], source: string) {
  txns.sort(function (a, b) { return a.date - b.date; });
  var byMonth: any = {};
  txns.forEach(function (t) {
    var k = monthKey(t.date);
    var m = byMonth[k] || (byMonth[k] = { dep: 0, depN: 0, deb: 0, days: {} });
    m.days[t.date.getDate()] = 1;
    if (TRANSFER_RE.test(t.desc)) return; // transfers are neither revenue nor expense
    if (t.amount > 0) { m.dep += t.amount; m.depN++; }
    else m.deb += -t.amount;
  });
  var months = Object.keys(byMonth).sort();
  if (!months.length) throw new Error('No dated transactions found');

  var full = months.slice();
  if (full.length > 2) {
    var last = byMonth[full[full.length - 1]];
    var lastDay = Math.max.apply(null, Object.keys(last.days).map(Number));
    if (lastDay < 25) full = full.slice(0, -1);
    var first = byMonth[full[0]];
    var firstDay = Math.min.apply(null, Object.keys(first.days).map(Number));
    if (full.length > 2 && firstDay > 7) full = full.slice(1);
  }

  var monthlyDeposits = months.map(function (k) {
    return { month: k, total: Math.round(byMonth[k].dep * 100) / 100, count: byMonth[k].depN };
  });
  function avgOf(keys: any[]) {
    if (!keys.length) return 0;
    return keys.reduce(function (s, k) { return s + byMonth[k].dep; }, 0) / keys.length;
  }
  var avgMonthlyDeposits = avgOf(full);
  var firstHalf = full.slice(0, Math.ceil(full.length / 2));
  var secondHalf = full.slice(Math.ceil(full.length / 2));
  var depositTrend = !secondHalf.length ? 'flat'
    : avgOf(secondHalf) > avgOf(firstHalf) * 1.07 ? 'up'
    : avgOf(secondHalf) < avgOf(firstHalf) * 0.93 ? 'down' : 'flat';

  var groups: any = {};
  txns.forEach(function (t) {
    if (t.amount >= 0 || TRANSFER_RE.test(t.desc)) return;
    var key = t.desc.replace(/[\d#*]/g, '').replace(/\s+/g, ' ').slice(0, 22).trim();
    if (!key) return;
    (groups[key] = groups[key] || []).push(t);
  });
  var recurringDebits = Object.keys(groups).filter(function (k) {
    return groups[k].length >= 4;
  }).map(function (k) {
    var g = groups[k];
    var amts = g.map(function (t) { return -t.amount; }).sort(function (a, b) { return a - b; });
    var med = amts[Math.floor(amts.length / 2)];
    var spanDays = Math.max((g[g.length - 1].date - g[0].date) / 864e5, 1);
    var perDay = g.length / spanDays;
    var cadence = perDay > 0.6 ? 'daily' : perDay > 0.12 ? 'weekly' : 'monthly';
    var monthlyTotal = med * (cadence === 'daily' ? 21 : cadence === 'weekly' ? 4.33 : 1);
    return {
      description: k, cadence: cadence, amount: med,
      monthlyTotal: Math.round(monthlyTotal),
      isLikelyFinancing: isFinancingDesc(k), occurrences: g.length
    };
  }).sort(function (a, b) { return b.monthlyTotal - a.monthlyTotal; });

  var withBal = txns.filter(function (t) { return t.balance != null; });
  var negDays: any = null, avgDailyBalance: any = null, endingBalances: any = null;
  if (withBal.length) {
    var lastPerDay: any = {}, lastPerMonth: any = {};
    withBal.forEach(function (t) {
      lastPerDay[t.date.toDateString()] = t.balance;
      lastPerMonth[monthKey(t.date)] = t.balance;
    });
    var dayVals = Object.keys(lastPerDay).map(function (k) { return lastPerDay[k]; });
    avgDailyBalance = dayVals.reduce(function (s, v) { return s + v; }, 0) / dayVals.length;
    negDays = dayVals.filter(function (v) { return v < 0; }).length;
    endingBalances = Object.keys(lastPerMonth).sort().map(function (k) {
      return { month: k, balance: lastPerMonth[k] };
    });
  }
  var nsfCount = txns.filter(function (t) { return NSF_RE.test(t.desc); }).length;

  var estDebt = recurringDebits.filter(function (r) { return r.isLikelyFinancing; })
    .reduce(function (s, r) { return s + r.monthlyTotal; }, 0);
  var estExpenses = full.length
    ? full.reduce(function (s, k) { return s + byMonth[k].deb; }, 0) / full.length : null;

  return {
    schemaVersion: 1,
    source: source,
    institution: null, accountMask: null, accountType: null,
    periodStart: txns[0].date.toISOString().slice(0, 10),
    periodEnd: txns[txns.length - 1].date.toISOString().slice(0, 10),
    monthsCovered: months.length,
    fullMonths: full.slice(),
    txnCount: txns.length,
    monthlyDeposits: monthlyDeposits,
    avgMonthlyDeposits: Math.round(avgMonthlyDeposits),
    depositTrend: depositTrend,
    avgDailyBalance: avgDailyBalance == null ? null : Math.round(avgDailyBalance),
    endingBalances: endingBalances,
    nsfCount: nsfCount,
    negativeDays: negDays,
    recurringDebits: recurringDebits,
    estimatedExistingDebtService: Math.round(estDebt),
    estimatedMonthlyExpenses: estExpenses == null ? null : Math.round(estExpenses),
    confidence: {
      deposits: full.length >= 3 ? 'high' : 'medium',
      balances: withBal.length ? 'medium' : 'none',
      obligations: 'low'
    }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AGGREGATION-PORT-END
// ─────────────────────────────────────────────────────────────────────────────

// Plaid POST helper — injects credentials; the body is never logged.
async function plaid(path: string, body: Record<string, unknown>): Promise<{
  ok: boolean; status: number; data: Record<string, unknown>;
}> {
  const resp = await fetch(`${PLAID_HOST}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: PLAID_CLIENT_ID, secret: PLAID_SECRET, ...body }),
  });
  const data = await resp.json().catch(() => ({}));
  return { ok: resp.ok, status: resp.status, data };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

  // ── Validate the payload. ──
  let body: { public_token?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }
  const publicToken = typeof body.public_token === "string" ? body.public_token.trim() : "";
  if (!publicToken) return json({ error: "invalid_public_token" }, 400);

  // ── 1. Exchange. access_token lives in this variable ONLY (see contract). ──
  const ex = await plaid("/item/public_token/exchange", { public_token: publicToken });
  // deno-lint-ignore no-explicit-any
  const accessToken = typeof (ex.data as any)?.access_token === "string" ? (ex.data as any).access_token : "";
  if (!ex.ok || !accessToken) {
    console.error("Plaid exchange failed", ex.status, (ex.data as { error_code?: string })?.error_code ?? "?");
    return json({ error: "plaid_error", status: ex.status }, 502);
  }

  // ── 2. Pull transactions via /transactions/sync. Right after exchange the
  //    initial history may not be ready yet (sandbox usually settles within a
  //    few seconds) — retry the whole sync a few times if it comes back empty.
  // deno-lint-ignore no-explicit-any
  let raw: any[] = [];
  for (let attempt = 0; attempt < 6; attempt++) {
    raw = [];
    let cursor = "";
    let hasMore = true;
    let pages = 0;
    while (hasMore && pages < 30) {
      const sync = await plaid("/transactions/sync", {
        access_token: accessToken,
        cursor,
        count: 500,
      });
      if (!sync.ok) {
        console.error("Plaid transactions/sync failed", sync.status,
          (sync.data as { error_code?: string })?.error_code ?? "?");
        return json({ error: "plaid_error", status: sync.status }, 502);
      }
      // deno-lint-ignore no-explicit-any
      const d = sync.data as any;
      raw = raw.concat(d.added ?? []);
      cursor = d.next_cursor ?? "";
      hasMore = !!d.has_more;
      pages++;
    }
    if (raw.length) break;
    await sleep(1500);
  }
  if (!raw.length) return json({ error: "no_transactions" }, 422);

  // ── 3. Balances (point-in-time) + best-effort institution name. ──
  const balResp = await plaid("/accounts/balance/get", { access_token: accessToken });
  // deno-lint-ignore no-explicit-any
  const accounts: any[] = balResp.ok ? ((balResp.data as any).accounts ?? []) : [];

  let institution: string | null = null;
  try {
    const item = await plaid("/item/get", { access_token: accessToken });
    // deno-lint-ignore no-explicit-any
    const instId = (item.data as any)?.item?.institution_id;
    if (instId) {
      const inst = await plaid("/institutions/get_by_id", {
        institution_id: instId,
        country_codes: ["US"],
      });
      // deno-lint-ignore no-explicit-any
      institution = (inst.data as any)?.institution?.name ?? null;
    }
  } catch {
    institution = null; // cosmetic — BankProfile tolerates nulls (BANK_DATA.md §2)
  }

  // ── 4. Scope to the primary operating account: the depository account with
  //    the most posted transactions (statement-drop parity is one account). ──
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - MONTHS_BACK); // keep ~6 months
  const posted = raw.filter((t) => !t.pending && typeof t.date === "string");

  const countByAccount: Record<string, number> = {};
  for (const t of posted) countByAccount[t.account_id] = (countByAccount[t.account_id] ?? 0) + 1;
  const depository = accounts.filter((a) => a.type === "depository");
  const candidates = depository.length ? depository : accounts;
  let primary = candidates[0] ?? null;
  for (const a of candidates) {
    if ((countByAccount[a.account_id] ?? 0) > (countByAccount[primary?.account_id] ?? -1)) primary = a;
  }
  const primaryId = primary?.account_id ?? null;

  // ── 5. Map Plaid txns to the client parsers' internal shape. Plaid amounts
  //    are positive for money LEAVING the account — flip the sign so positive
  //    means deposit, matching js/bank-import.js. ──
  const txns = posted
    .filter((t) => (primaryId ? t.account_id === primaryId : true))
    .map((t) => {
      const parts = String(t.date).split("-"); // YYYY-MM-DD, local like the client parsers
      return {
        date: new Date(+parts[0], +parts[1] - 1, +parts[2]),
        desc: String(t.name ?? t.merchant_name ?? "").toUpperCase(),
        amount: -Number(t.amount),
        balance: null as number | null,
      };
    })
    .filter((t) => !isNaN(t.amount) && t.amount !== 0 && !isNaN(t.date.getTime()) && t.date >= cutoff);
  if (!txns.length) return json({ error: "no_transactions" }, 422);

  // ── 6. Negative-day APPROXIMATION (BANK_DATA.md §2 "where possible"): Plaid
  //    gives one point-in-time balance, not a history — reconstruct a running
  //    balance by walking back from the current balance through the posted
  //    transactions. Approximate (pending excluded, single anchor point), which
  //    is why the aggregation's "medium" balance confidence is honest here. ──
  const currentBal = primary?.balances?.current;
  if (typeof currentBal === "number") {
    const newestFirst = txns.slice().sort((a, b) => +b.date - +a.date);
    let running = currentBal;
    for (const t of newestFirst) {
      t.balance = Math.round(running * 100) / 100; // balance after this txn posted
      running -= t.amount;
    }
  }

  // ── 7. Aggregate (identical math to the statement path) and return. The
  //    access_token goes out of scope here — nothing was stored anywhere. ──
  // deno-lint-ignore no-explicit-any
  let profile: any;
  try {
    profile = buildProfile(txns, "plaid");
  } catch {
    return json({ error: "no_transactions" }, 422);
  }
  profile.institution = institution;
  profile.accountMask = primary?.mask ?? null;
  profile.accountType = primary?.subtype ?? primary?.type ?? null;

  console.log(`Plaid BankProfile computed for user ${user.id} (${profile.txnCount} txns, ${profile.monthsCovered} mo) — nothing stored`);
  return json({ bankProfile: profile });
});
