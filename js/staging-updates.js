// STAGING-ONLY MODULE — never merged to prod main. Loaded exclusively by the
// hostname-gated block in analytics.js (only on *.github.io), so even if a
// reference leaked to lendpaper.com, this file wouldn't load there.
//
// Demo-env feedback system (Steve 6/12):
//  1. Home tiles get a +N flag; CLICKING it opens a review panel listing each
//     in-flight update with Approve / Decline / Note per row.
//  2. Every page gets a "✎ feedback" pill (next to the build stamp): inspect
//     mode — hover highlights any element, click it, write a note, send.
//  3. Everything posts to Supabase `staging_feedback` (anon-insert). If the
//     table isn't reachable, rows queue in localStorage and auto-flush on a
//     later visit. Claude reads the table via run_sql.py each session.
//
// Manifest upkeep per staging refresh: add entries when a branch merges into
// staging; REMOVE them once it ships to prod main. New tools not yet in
// tools.js can be injected as demo tiles via INJECT_TILES.

const SB_URL = "https://arpquyoucdsdmbetgftj.supabase.co";
const SB_KEY = "sb_publishable_R18l5zBtRQ1CkSGNBkgZkg_dVVBldlb";
const BUILD = "s-0612";
const GREEN = "#1A3C2E";

const STAGING_UPDATES = {
  "affordability": [
    { ticket: "LEN-342", label: "Drop a bank statement (CSV/OFX) to autofill — add ?bankimport=1" },
    { ticket: "LEN-343", label: "Plaid sandbox 'connect your bank' path (inert until keys)" }
  ],
  "deal-read": [
    { ticket: "LEN-342", label: "Statement-drop fills deposits + NSF/negative-days context — ?bankimport=1" },
    { ticket: "LEN-343", label: "Plaid sandbox connect link in the same drop zone" }
  ],
  "dscr": [
    { ticket: "LEN-226", label: "Deal-context block moved above the Save-PDF action stack" }
  ],
  "amo": [
    { ticket: "LEN-226", label: "Borrower State moved to foot of left input column" }
  ]
};
const INJECT_TILES = []; // {id,name,desc,href,cat,updates:[{ticket,label}]}

/* ---------------- persistence ---------------- */
const QKEY = "lp_staging_feedback_queue";
async function postRows(rows) {
  const res = await fetch(SB_URL + "/rest/v1/staging_feedback", {
    method: "POST",
    headers: { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY,
               "Content-Type": "application/json", "Prefer": "return=minimal" },
    body: JSON.stringify(rows)
  });
  if (!res.ok) throw new Error("supabase " + res.status);
}
async function submitFeedback(rows) {
  rows = rows.map(r => ({ build: BUILD, page: location.pathname + location.search,
                          ua: navigator.userAgent.slice(0, 120), ...r }));
  try { await postRows(rows); toast("Feedback sent ✓"); }
  catch (e) {
    const q = JSON.parse(localStorage.getItem(QKEY) || "[]");
    localStorage.setItem(QKEY, JSON.stringify(q.concat(rows)));
    toast("Saved locally — will sync when the feedback table is live");
  }
}
async function flushQueue() {
  const q = JSON.parse(localStorage.getItem(QKEY) || "[]");
  if (!q.length) return;
  try { await postRows(q); localStorage.removeItem(QKEY); toast(q.length + " queued feedback item(s) synced ✓"); }
  catch (e) { /* table still not live; keep queue */ }
}

/* ---------------- tiny UI helpers ---------------- */
const MONO = "ui-monospace,Menlo,monospace";
function el(tag, css, text) {
  const n = document.createElement(tag);
  if (css) n.style.cssText = css;
  if (text != null) n.textContent = text;
  return n;
}
let toastTimer;
function toast(msg) {
  let t = document.getElementById("lp-stage-toast");
  if (!t) {
    t = el("div", "position:fixed;bottom:44px;left:10px;z-index:100001;font:600 12px/1.3 " + MONO +
      ";color:#fff;background:" + GREEN + ";border-radius:8px;padding:8px 12px;max-width:300px;" +
      "box-shadow:0 6px 18px rgba(0,0,0,.18);transition:opacity .25s");
    t.id = "lp-stage-toast";
    document.body.appendChild(t);
  }
  t.textContent = msg; t.style.opacity = "1";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.opacity = "0"; }, 2600);
}
function closePanel() { const p = document.getElementById("lp-stage-panel"); if (p) p.remove(); }

/* ---------------- 1. update review panel ---------------- */
function openReviewPanel(toolId, name, updates) {
  closePanel();
  const p = el("div", "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:100000;" +
    "width:min(460px,92vw);background:#fff;border:1px solid #e3e7e4;border-top:3px solid " + GREEN +
    ";border-radius:12px;box-shadow:0 18px 60px rgba(0,0,0,.22);font-family:" + MONO + ";color:#1c211e");
  p.id = "lp-stage-panel";
  const head = el("div", "display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid #eef1ee");
  head.appendChild(el("div", "font:700 13px/1 " + MONO, name + " — in this build"));
  const x = el("button", "margin-left:auto;border:0;background:none;cursor:pointer;font-size:14px;color:#6b746f", "✕");
  x.onclick = closePanel; head.appendChild(x); p.appendChild(head);

  const rowsState = [];
  updates.forEach(u => {
    const st = { ticket: u.ticket, verdict: null, note: "" };
    rowsState.push(st);
    const row = el("div", "padding:11px 14px;border-bottom:1px solid #f2f4f2");
    row.appendChild(el("div", "font:700 11.5px/1 " + MONO + ";color:" + GREEN, u.ticket));
    row.appendChild(el("div", "font:400 12px/1.45 " + MONO + ";margin-top:4px;color:#3c443f", u.label));
    const btns = el("div", "display:flex;gap:8px;margin-top:8px;align-items:center");
    const mk = (lbl, v, on, off) => {
      const b = el("button", "font:700 11px/1 " + MONO + ";padding:6px 10px;border-radius:7px;cursor:pointer;" +
        "border:1px solid #d7e2d9;background:#fff;color:#3c443f", lbl);
      b.onclick = () => {
        st.verdict = st.verdict === v ? null : v;
        btns.querySelectorAll("button[data-v]").forEach(o => { o.style.background = "#fff"; o.style.color = "#3c443f"; });
        if (st.verdict) { b.style.background = on; b.style.color = off; }
      };
      b.dataset.v = v; return b;
    };
    btns.appendChild(mk("✓ Approve", "approve", GREEN, "#fff"));
    btns.appendChild(mk("✕ Decline", "decline", "#8a2f1f", "#fff"));
    row.appendChild(btns);
    const ta = el("textarea", "width:100%;margin-top:8px;font:400 12px/1.4 " + MONO + ";border:1px solid #e3e7e4;" +
      "border-radius:7px;padding:7px 9px;min-height:34px;resize:vertical;box-sizing:border-box;color:#1c211e");
    ta.placeholder = "Notes / what's wrong (optional)";
    ta.oninput = () => { st.note = ta.value; };
    row.appendChild(ta);
    p.appendChild(row);
  });

  const foot = el("div", "display:flex;gap:8px;padding:12px 14px");
  const send = el("button", "font:700 12px/1 " + MONO + ";padding:9px 16px;border-radius:8px;border:0;" +
    "cursor:pointer;background:" + GREEN + ";color:#fff", "Send feedback");
  send.onclick = () => {
    const rows = rowsState.filter(r => r.verdict || r.note.trim()).map(r => ({
      kind: "update-review", tool: toolId, ticket: r.ticket, verdict: r.verdict, note: r.note.trim() || null
    }));
    if (!rows.length) { toast("Pick a verdict or write a note first"); return; }
    submitFeedback(rows); closePanel();
  };
  foot.appendChild(send);
  const open = el("a", "font:600 11.5px/1 " + MONO + ";margin-left:auto;align-self:center;color:#6b746f", "open tool →");
  open.href = (document.querySelector('a.card[data-id="' + toolId + '"]') || {}).href || "#";
  foot.appendChild(open);
  p.appendChild(foot);
  document.body.appendChild(p);
}

/* ---------------- tile flags ---------------- */
function tipText(updates) {
  return "Click to review — in this staging build:\n" +
    updates.map(u => "• " + u.ticket + " — " + u.label).join("\n");
}
function decorate() {
  const cards = document.querySelectorAll("a.card[data-id]");
  if (!cards.length) return false;
  cards.forEach(card => {
    const ups = STAGING_UPDATES[card.dataset.id];
    if (!ups || card.querySelector(".lp-stage-flag")) return;
    const name = card.querySelector(".card-name");
    if (!name) return;
    const flag = el("sup", "font:700 10px/1 " + MONO + ";color:" + GREEN + ";background:#edf2eb;" +
      "border:1px solid #d7e2d9;border-radius:5px;padding:1px 4px;margin-left:6px;vertical-align:super;cursor:pointer",
      " +" + ups.length);
    flag.className = "lp-stage-flag";
    flag.title = tipText(ups);
    flag.onclick = e => {
      e.preventDefault(); e.stopPropagation();
      openReviewPanel(card.dataset.id, name.childNodes[0].textContent.trim(), ups);
    };
    name.appendChild(flag);
  });
  INJECT_TILES.forEach(t => {
    const grid = document.querySelector("#" + t.cat + " .cards");
    if (!grid || grid.querySelector('[data-id="' + t.id + '"]')) return;
    const a = el("a"); a.href = t.href; a.className = "card"; a.dataset.id = t.id;
    a.innerHTML = '<div class="card-body"><div class="card-name">' + t.name +
      '</div><div class="card-desc">' + t.desc + "</div></div>";
    grid.appendChild(a);
    STAGING_UPDATES[t.id] = t.updates; // picked up by next decorate pass
  });
  return true;
}

/* ---------------- 2. click-anything inspect mode ---------------- */
let inspecting = false, hoverBox = null, fbBtn = null;
function selectorFor(node) {
  const parts = [];
  let n = node;
  while (n && n.nodeType === 1 && parts.length < 6) {
    if (n.id) { parts.unshift("#" + n.id); break; }
    let s = n.tagName.toLowerCase();
    const cls = (n.className && typeof n.className === "string") ? n.className.trim().split(/\s+/).slice(0, 2) : [];
    if (cls.length) s += "." + cls.join(".");
    const sibs = n.parentNode ? Array.from(n.parentNode.children).filter(c => c.tagName === n.tagName) : [];
    if (sibs.length > 1) s += ":nth-of-type(" + (sibs.indexOf(n) + 1) + ")";
    parts.unshift(s);
    n = n.parentNode;
  }
  return parts.join(" > ");
}
function setInspect(on) {
  inspecting = on;
  fbBtn.textContent = on ? "✕ exit feedback (or Esc)" : "✎ feedback";
  fbBtn.style.background = on ? GREEN : "rgba(255,255,255,.85)";
  fbBtn.style.color = on ? "#fff" : "#6b746f";
  document.body.style.cursor = on ? "crosshair" : "";
  if (!on && hoverBox) hoverBox.style.display = "none";
}
function initInspect() {
  hoverBox = el("div", "position:fixed;z-index:99998;pointer-events:none;display:none;" +
    "border:2px dashed " + GREEN + ";border-radius:4px;background:rgba(26,60,46,.06)");
  document.body.appendChild(hoverBox);
  document.addEventListener("mousemove", e => {
    if (!inspecting) return;
    const t = e.target;
    if (!t || t === hoverBox || t.closest("#lp-stage-panel") || t === fbBtn) { hoverBox.style.display = "none"; return; }
    const r = t.getBoundingClientRect();
    hoverBox.style.display = "block";
    hoverBox.style.left = r.left - 2 + "px"; hoverBox.style.top = r.top - 2 + "px";
    hoverBox.style.width = r.width + "px"; hoverBox.style.height = r.height + "px";
  }, true);
  document.addEventListener("click", e => {
    if (!inspecting) return;
    const t = e.target;
    if (t === fbBtn || t.closest("#lp-stage-panel")) return;
    e.preventDefault(); e.stopPropagation();
    setInspect(false);
    openElementForm(t);
  }, true);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { if (inspecting) setInspect(false); closePanel(); }
  });
}
function openElementForm(target) {
  closePanel();
  const sel = selectorFor(target);
  const snippet = (target.innerText || target.value || "").trim().replace(/\s+/g, " ").slice(0, 140);
  const p = el("div", "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:100000;" +
    "width:min(440px,92vw);background:#fff;border:1px solid #e3e7e4;border-top:3px solid " + GREEN +
    ";border-radius:12px;box-shadow:0 18px 60px rgba(0,0,0,.22);font-family:" + MONO + ";padding:14px;color:#1c211e");
  p.id = "lp-stage-panel";
  p.appendChild(el("div", "font:700 13px/1 " + MONO, "Feedback on this element"));
  p.appendChild(el("div", "font:400 11px/1.5 " + MONO + ";color:#6b746f;margin-top:7px;word-break:break-all", sel));
  if (snippet) p.appendChild(el("div", "font:400 11.5px/1.5 " + MONO + ";margin-top:6px;color:#3c443f;" +
    "background:#f6f8f6;border-radius:6px;padding:6px 8px", "“" + snippet + "”"));
  const ta = el("textarea", "width:100%;margin-top:10px;font:400 12.5px/1.4 " + MONO + ";border:1px solid #e3e7e4;" +
    "border-radius:7px;padding:8px 10px;min-height:64px;resize:vertical;box-sizing:border-box;color:#1c211e");
  ta.placeholder = "What's the issue / what should change?";
  p.appendChild(ta);
  const foot = el("div", "display:flex;gap:8px;margin-top:10px");
  const send = el("button", "font:700 12px/1 " + MONO + ";padding:9px 16px;border-radius:8px;border:0;" +
    "cursor:pointer;background:" + GREEN + ";color:#fff", "Send");
  send.onclick = () => {
    if (!ta.value.trim()) { toast("Write a note first"); return; }
    submitFeedback([{ kind: "element", selector: sel, snippet: snippet || null, note: ta.value.trim() }]);
    closePanel();
  };
  const cancel = el("button", "font:600 12px/1 " + MONO + ";padding:9px 14px;border-radius:8px;cursor:pointer;" +
    "border:1px solid #e3e7e4;background:#fff;color:#6b746f", "Cancel");
  cancel.onclick = closePanel;
  foot.appendChild(send); foot.appendChild(cancel);
  p.appendChild(foot);
  document.body.appendChild(p);
  setTimeout(() => ta.focus(), 50);
}

/* ---------------- boot ---------------- */
function boot() {
  fbBtn = el("button", "position:fixed;bottom:8px;left:118px;z-index:99999;font:600 10.5px/1 " + MONO +
    ";color:#6b746f;background:rgba(255,255,255,.85);border:1px solid #e3e7e4;border-left:3px solid " + GREEN +
    ";border-radius:6px;padding:4px 8px;cursor:pointer", "✎ feedback");
  fbBtn.id = "lp-stage-fb";
  fbBtn.onclick = () => setInspect(!inspecting);
  document.body.appendChild(fbBtn);
  initInspect();
  flushQueue();
  let tries = 0;
  const timer = setInterval(() => { if (decorate() || ++tries > 20) clearInterval(timer); }, 300);
}
if (document.body) boot();
else window.addEventListener("DOMContentLoaded", boot);

export { STAGING_UPDATES };
