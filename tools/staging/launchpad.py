#!/usr/bin/env python3
"""
LendPaper staging launchpad — a review queue over every in-flight, unpublished branch.

Auto-discovers every git worktree (via `git worktree list`), serves each one as a
static site on its own port, and renders an index linking to all of them. No manifest
to maintain: a worktree appears when it's created and disappears when it's removed
(i.e. after the branch merges and you `git worktree remove` it).

    python3 tools/staging/launchpad.py
    # → http://localhost:8780/

Why per-port (not one path-prefixed server): the pages use root-absolute asset paths
(/public, /js, …), which only resolve when each worktree is served at its own root.

The `main` mirror worktree is intentionally skipped (it's what's already live).
Re-scans on every index load, so new worktrees show up without a restart.

Review state (LEN-313) persists in ~/lp-worktrees/.launchpad-state.json, keyed by
worktree dir name: {"status": pending|approved|needs-work, "tags": [...],
"checks": {"<tip-id>": true}, "updated": iso}.
POST /api/state {"name", "status"?, "tags"?, "checks"?} merges + saves atomically
("checks" merges per key; a false value deletes that key).

v2.1 (LEN-315): per-card goal + request date read from ~/lp-worktrees/.launchpad-intents.json
(read-only manifest owned elsewhere; keyed by ticket id OR worktree dir name; falls back
to the last commit subject), staleness meta line + amber warning band, hard block for
worktrees whose merge-base predates DESIGN_EPOCH (the 6/11 open-access flag-day), and
always-visible what-to-check checkboxes that persist in the state file.
"""
import datetime
import functools
import hashlib
import http.server
import json
import os
import re
import socketserver
import subprocess
import threading

BASE_PORT = int(os.environ.get("LP_STAGING_PORT", "8780"))
WORKTREE_ROOT = os.path.expanduser("~/lp-worktrees")
STATE_PATH = os.path.join(WORKTREE_ROOT, ".launchpad-state.json")
INTENTS_PATH = os.path.join(WORKTREE_ROOT, ".launchpad-intents.json")
VALID_STATUS = {"pending", "approved", "needs-work", "rejected"}
DESIGN_EPOCH = "5bcb6c9d8fab3053b18d54061ce179c6570bb9da"  # open-access merge 6/11 — bump on each design flag-day.
# `git worktree list` must run from inside the repo; the script always lives in a worktree.
REPO_ANCHOR = os.path.dirname(os.path.abspath(__file__))

_servers = {}          # path -> (port, thread)
_lock = threading.Lock()
_state_lock = threading.Lock()


def sh(args, cwd=None):
    try:
        return subprocess.run(args, cwd=cwd, capture_output=True, text=True, timeout=15).stdout.strip()
    except Exception:
        return ""


def ok(args, cwd=None):
    try:
        return subprocess.run(args, cwd=cwd, capture_output=True, timeout=15).returncode == 0
    except Exception:
        return False


def discover():
    """Return [{path, branch, ticket, changed, subject, last, base, behind, epoch_ok}]
    for every worktree except the main mirror."""
    out = sh(["git", "worktree", "list", "--porcelain"], cwd=REPO_ANCHOR)
    items, cur = [], {}
    for line in out.splitlines():
        if line.startswith("worktree "):
            cur = {"path": line[len("worktree "):]}
        elif line.startswith("branch "):
            cur["branch"] = line[len("branch "):].replace("refs/heads/", "")
        elif line == "" and cur:
            items.append(cur); cur = {}
    if cur:
        items.append(cur)

    result = []
    for it in items:
        path = it.get("path", "")
        branch = it.get("branch", "(detached)")
        if not path or not os.path.isdir(path):
            continue
        if branch == "main" or os.path.basename(path) == "main":
            continue  # the live mirror — skip
        if not (path + os.sep).startswith(WORKTREE_ROOT + os.sep):
            continue  # legacy clones / nested agent worktrees — retired designs must never preview (LEN-312)
        committed = sh(["git", "diff", "--name-only", "origin/main...HEAD"], cwd=path)
        dirty = sh(["git", "status", "--porcelain"], cwd=path)
        dirty_tracked = [l for l in dirty.splitlines() if not l.startswith("??")]
        if not dirty_tracked and ok(["git", "merge-base", "--is-ancestor", "HEAD", "origin/main"], cwd=path):
            continue  # fully merged + clean — already live, nothing in flight (LEN-312)
        changed = sorted({*(committed.splitlines()),
                          *(l[3:] for l in dirty.splitlines() if len(l) > 3)})
        m = re.search(r"len-(\d+)", branch, re.I)
        ticket = f"LEN-{m.group(1)}" if m else ""
        # staleness vs origin/main (LEN-315) — rev-list uses --count, no commit list materialized
        mb = sh(["git", "merge-base", "HEAD", "origin/main"], cwd=path)
        behind = sh(["git", "rev-list", "--count", "HEAD..origin/main"], cwd=path)
        n_behind = int(behind) if behind.isdigit() else 0
        # what the branch's preview is missing (so a stale-base artifact is self-explanatory)
        missing = sh(["git", "log", "--format=%s", "--max-count=6", "HEAD..origin/main"],
                     cwd=path).splitlines() if n_behind else []
        result.append({"path": path, "branch": branch, "ticket": ticket, "changed": changed,
                       "subject": sh(["git", "log", "-1", "--format=%s", "HEAD"], cwd=path),
                       "last": sh(["git", "log", "-1", "--format=%cs", "HEAD"], cwd=path),
                       "base": sh(["git", "log", "-1", "--format=%cs", mb], cwd=path) if mb else "",
                       "behind": n_behind, "missing": missing,
                       "epoch_ok": bool(mb) and ok(["git", "merge-base", "--is-ancestor",
                                                    DESIGN_EPOCH, mb], cwd=path)})
    result.sort(key=lambda r: r["path"])
    return result


# what-to-check tips, matched against changed paths in specificity order (LEN-313)
TIP_RULES = [
    (r"^calculators/", [
        "Focus any field: exactly ONE 2px green outline, no box-shadow ring",
        "Run a full calc; numbers sane?",
        "Save PDF: branding green #1A3C2E, no clipped left edge, borrower-voice copy"]),
    (r"^index\.html$", [
        "Tile names current: Amortization / Deal Analysis / Net & Position / SBA Fees / Payment Fit",
        "NO coming-soon teasers (LEN-285)",
        "No 'Anybody' font anywhere — Figtree headings only",
        "CURRENT_VERSION bumped?"]),
    (r"^lp-panel\.html$", [
        "Admin-only surface: counts match Supabase? No layout overflow?"]),
    (r"^waterfall\.html$", [
        "Lender display names intact (DISPLAY_NAME_OVERRIDES)",
        "Logos render",
        "List not blank"]),
    (r"legislation|compliance", [
        "Ran npm run verify:sources? Every item has .gov + independent news link"]),
    (r"js/auth|login|onboarding", [
        "Logged-out AND logged-in load clean",
        "No magic links",
        "No approval gates on tools"]),
    (r"quote-log", [
        "Save → appears in Deal Log",
        "Restore refills the calc"]),
]
FALLBACK_TIPS = ["Open at desktop + 390px width", "Console clean", "Ends at </html>"]


def tips_for(changed):
    tips = []
    for pat, tt in TIP_RULES:
        if any(re.search(pat, c) for c in changed):
            tips += [t for t in tt if t not in tips]
    return tips[:4] or FALLBACK_TIPS


def load_state():
    try:
        with open(STATE_PATH) as f:
            d = json.load(f)
        return d if isinstance(d, dict) else {}
    except Exception:
        return {}


def load_intents():
    """Goal manifest (LEN-315) — owned by a separate process; read-only here."""
    try:
        with open(INTENTS_PATH) as f:
            d = json.load(f)
        return d if isinstance(d, dict) else {}
    except Exception:
        return {}


def save_state(state):
    tmp = STATE_PATH + ".tmp"
    with open(tmp, "w") as f:
        json.dump(state, f, indent=1)
    os.replace(tmp, STATE_PATH)


def ensure_server(path):
    """Start a static server for `path` if not already running; return its port."""
    with _lock:
        if path in _servers:
            return _servers[path][0]
        port = BASE_PORT + 1 + len(_servers)
        handler = functools.partial(QuietHandler, directory=path)
        # find a free port starting at the computed one
        while True:
            try:
                httpd = socketserver.ThreadingTCPServer(("", port), handler)
                break
            except OSError:
                port += 1
        httpd.daemon_threads = True
        t = threading.Thread(target=httpd.serve_forever, daemon=True)
        t.start()
        _servers[path] = (port, t)
        return port


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def index_html(rows, retired=()):
    payload = [{k: r[k] for k in ("name", "branch", "ticket", "port", "changed", "missing",
                                  "htmls", "tips", "status", "tags", "checks",
                                  "goal", "requested", "goal_src",
                                  "last", "base", "behind", "epoch_ok")} for r in rows]
    data = json.dumps(payload).replace("</", "<\\/")
    n = sum(1 for r in rows if r["epoch_ok"])  # blocked rows don't count as in flight
    ret = (f"{len(retired)} retired request{'s' if len(retired) != 1 else ''} hidden "
           f"(superseded / canceled / already shipped): {esc(', '.join(sorted(retired)))}. "
           f"Restore via .launchpad-state.json." if retired else "")
    return (TEMPLATE.replace("{{DATA}}", data).replace("{{N}}", str(n))
                    .replace("{{RETIRED}}", ret))


class LaunchpadHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _json(self, code, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        rows = discover()
        state = load_state()
        intents = load_intents()
        for r in rows:
            r["port"] = ensure_server(r["path"])
            r["name"] = os.path.basename(r["path"])
            st = state.get(r["name"], {})
            r["status"] = st.get("status", "pending")
            r["tags"] = st.get("tags", []) if isinstance(st.get("tags"), list) else []
            r["checks"] = st.get("checks", {}) if isinstance(st.get("checks"), dict) else {}
            it = intents.get(r["ticket"]) or intents.get(r["name"]) or {}
            it = it if isinstance(it, dict) else {}
            r["goal"] = str(it.get("goal") or "").strip()
            r["requested"] = str(it.get("requested") or "").strip()
            r["goal_src"] = "manifest" if r["goal"] else "commit"
            if not r["goal"]:
                r["goal"], r["requested"] = r["subject"], ""
            r["htmls"] = [c for c in r["changed"] if c.endswith(".html")]
            r["tips"] = [{"id": hashlib.sha1(t.encode()).hexdigest()[:8], "text": t}
                         for t in tips_for(r["changed"])]
        # retired = dead requests (superseded/canceled/shipped) — hidden entirely (LEN-321)
        retired = [r["name"] for r in rows
                   if isinstance(state.get(r["name"]), dict) and state[r["name"]].get("retired")]
        rows = [r for r in rows if r["name"] not in retired]
        html = index_html(rows, retired).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(html)))
        self.end_headers()
        self.wfile.write(html)

    def do_POST(self):
        if self.path != "/api/state":
            self._json(404, {"error": "not found"}); return
        try:
            n = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(n))
            name = str(body["name"])
            assert name and "/" not in name and name not in (".", "..")
        except Exception:
            self._json(400, {"error": "bad request"}); return
        if "status" in body and body["status"] not in VALID_STATUS:
            self._json(400, {"error": "bad status"}); return
        if "tags" in body and not isinstance(body["tags"], list):
            self._json(400, {"error": "bad tags"}); return
        if "checks" in body and not isinstance(body["checks"], dict):
            self._json(400, {"error": "bad checks"}); return
        if "retired" in body and not isinstance(body["retired"], bool):
            self._json(400, {"error": "bad retired"}); return
        with _state_lock:
            state = load_state()
            entry = state.get(name) if isinstance(state.get(name), dict) else None
            entry = entry or {"status": "pending", "tags": []}
            if "status" in body:
                entry["status"] = body["status"]
            if "tags" in body:
                entry["tags"] = sorted({str(t) for t in body["tags"]})[:8]
            if "retired" in body:
                if body["retired"]:
                    entry["retired"] = True
                else:
                    entry.pop("retired", None)
            if "checks" in body:
                checks = entry.get("checks") if isinstance(entry.get("checks"), dict) else {}
                for k, v in body["checks"].items():  # merge: truthy sets, falsy deletes
                    if v:
                        checks[str(k)] = True
                    else:
                        checks.pop(str(k), None)
                entry["checks"] = checks
            entry["updated"] = datetime.datetime.now().astimezone().isoformat(timespec="seconds")
            state[name] = entry
            save_state(state)
        self._json(200, {"name": name, **entry})


TEMPLATE = """<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LendPaper · Staging launchpad</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='5' fill='%231A3C2E'/%3E%3Cpath d='M4 4v16h11l5-5V4H4z' fill='none' stroke='white' stroke-width='2.5'/%3E%3C/svg%3E">
<style>
:root{--brand:#1A3C2E;--mid:#2D6A4F;--amber:#B45309;--bg:#F7F8F7;--border:#e3e7e4;--muted:#6b746f}
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:#1c2420}
header{background:var(--brand);color:#fff;padding:20px 28px}header h1{margin:0;font-size:19px}header p{margin:6px 0 0;font-size:13px;opacity:.82}
.prog{display:flex;align-items:center;gap:12px;margin-top:13px;max-width:460px}
.prog-track{flex:1;height:7px;background:rgba(255,255,255,.22);border-radius:4px;overflow:hidden}
#progfill{height:100%;width:0;background:#fff;border-radius:4px;transition:width .35s ease}
#proglabel{font-size:12px;opacity:.92;white-space:nowrap}
.wrap{max-width:960px;margin:0 auto;padding:22px 20px 60px}
.filters{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}
.fbtn{font-size:12.5px;font-weight:600;color:var(--brand);background:#fff;border:1px solid var(--border);border-radius:7px;padding:6px 12px;cursor:pointer}
.fbtn.on{background:var(--brand);border-color:var(--brand);color:#fff}
#cards{display:flex;flex-direction:column}
.card{position:relative;background:#fff;border:1px solid var(--border);border-left:3px solid var(--border);border-radius:12px;padding:14px 17px;margin-bottom:13px}
.card:focus{outline:2px solid var(--brand);outline-offset:2px;box-shadow:none}
.card.approved{border-left-color:var(--brand)}
.card.needswork{border-left-color:var(--amber)}
.card.rejected{border-left-color:#991B1B;opacity:.55}
.card.finished{opacity:.55;padding:8px 17px}
.card.finished.peek{opacity:.85;padding:14px 17px}
.card.finished .full{display:none}
.card.finished.peek .full{display:block}
.slim{display:none;align-items:center;gap:10px;cursor:pointer;font-size:12.5px}
.card.finished .slim{display:flex}
.slim-name{font-weight:600}
.slim-branch{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;color:var(--muted)}
.slim-kicker{margin-left:auto}
.top{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.ticket{font-weight:700;font-size:12px;color:#fff;background:var(--mid);border-radius:5px;padding:2px 8px;text-decoration:none}
.ticket:hover{background:var(--brand)}
.branch{font-family:ui-monospace,Menlo,monospace;font-size:12px;color:var(--brand)}
.port{font-size:11.5px;color:var(--muted)}
.kicker{font-size:11px;font-weight:700;letter-spacing:.06em;margin-left:auto}
.card.approved .kicker,.card.approved .slim-kicker{color:var(--brand)}
.card.needswork .kicker,.card.needswork .slim-kicker{color:var(--amber)}
.card.rejected .kicker,.card.rejected .slim-kicker{color:#991B1B}
.btn.reject{color:#991B1B;border-color:#991B1B}
.slim-kicker{font-size:11px;font-weight:700;letter-spacing:.06em}
.wt{font-size:15px;font-weight:600;margin:9px 0 3px}
.goal{margin:2px 0 8px}
.goal-k{font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--mid)}
.goal-t{font-size:13.5px;margin-top:2px}
.goal-src{color:var(--muted);font-size:12px;font-weight:400}
.changed{font-size:12px;color:var(--muted);font-family:ui-monospace,Menlo,monospace}
.meta{font-size:11.5px;color:var(--muted);margin-top:5px}
.newer{margin-top:7px;padding:7px 10px;background:#F8FAF9;border:1px solid var(--border);border-radius:7px}
.newer-k{font-size:10.5px;font-weight:700;letter-spacing:.04em;color:#B45309;margin-bottom:3px}
.newer-i{font-size:11.5px;color:var(--muted);font-family:ui-monospace,Menlo,monospace;line-height:1.5}
.warnband{background:#FFFBEB;color:#B45309;font-size:12.5px;font-weight:600;border-radius:8px;padding:7px 11px;margin:0 0 10px}
.blockband{background:#FEF2F2;color:#991B1B;font-size:12.5px;font-weight:700;border-radius:8px;padding:7px 11px;margin:0 0 10px}
.checks{margin-top:11px}
.checks-k{font-size:12px;font-weight:700;letter-spacing:.08em;color:var(--mid)}
.check{display:flex;align-items:flex-start;gap:7px;font-size:12.5px;color:#3a443e;margin-top:5px;cursor:pointer}
.check input{margin:1px 0 0;accent-color:var(--brand)}
.nudge{font-size:12px;color:var(--mid);font-weight:600;align-self:center}
.links{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}
.linkgroup{display:inline-flex}
.links a{font-size:13px;text-decoration:none;color:var(--brand);background:#fff;border:1px solid var(--brand);border-radius:7px 0 0 7px;padding:6px 11px;font-weight:600}
.links a:hover{background:var(--brand);color:#fff}
.pv-toggle{font-size:12px;color:var(--mid);background:#fff;border:1px solid var(--brand);border-left:none;border-radius:0 7px 7px 0;padding:6px 9px;cursor:pointer;font-weight:600}
.pv-toggle:hover{background:var(--mid);color:#fff}
.pv{margin-top:10px}
.pvbar{display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--muted);font-family:ui-monospace,Menlo,monospace;margin-bottom:4px}
.pvclose{font-size:11.5px;color:var(--muted);background:none;border:1px solid var(--border);border-radius:6px;padding:2px 9px;cursor:pointer}
.pvclose:hover{color:var(--brand);border-color:var(--brand)}
.pv iframe{display:block;width:100%;height:520px;border:1px solid #e3e7e4;border-radius:8px;background:#fff}
.actions{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:12px;padding-top:11px;border-top:1px solid var(--border)}
.chips{display:flex;gap:6px;flex-wrap:wrap}
.chip{font-size:11.5px;color:var(--muted);background:#fff;border:1px solid var(--border);border-radius:6px;padding:3px 10px;cursor:pointer}
.chip.on{color:var(--brand);border-color:var(--brand);background:#eef4f0;font-weight:600}
.btns{display:flex;gap:7px}
.btn{font-size:12.5px;font-weight:600;border-radius:7px;padding:6px 13px;cursor:pointer;background:#fff}
.btn.approve{color:var(--brand);border:1px solid var(--brand)}
.card.approved .btn.approve{background:var(--brand);color:#fff}
.btn.needsw{color:var(--amber);border:1px solid var(--amber)}
.card.needswork .btn.needsw{background:var(--amber);color:#fff}
.clearcard{background:#fff;border:1px solid var(--border);border-left:3px solid var(--brand);border-radius:12px;padding:22px 20px;margin-bottom:13px;font-size:15px}
.clearcard b{color:var(--brand)}
.clearcard span{display:block;margin-top:4px;font-size:12.5px;color:var(--muted)}
.confetti{position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:12px}
.confetti i{position:absolute;top:6px;width:6px;height:10px;animation:cfall .8s ease-out forwards}
@keyframes cfall{from{transform:translateY(0) rotate(0deg);opacity:1}to{transform:translateY(96px) rotate(230deg);opacity:0}}
.empty{color:var(--muted);font-size:14px;padding:14px 0}
#blocked{margin-top:36px;border-left:3px solid #991B1B;padding-left:15px}
.blocked-title{font-size:13px;font-weight:700;color:#991B1B;margin-bottom:10px}
.brow{background:#fff;border:1px solid var(--border);border-radius:10px;padding:9px 13px;margin-bottom:8px}
.brow-line{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:12.5px}
.brow-goal{color:#3a443e;font-size:12px}
.brow-meta{color:var(--muted);font-size:11.5px}
.bshow{margin-left:auto;font-size:11.5px;color:#991B1B;background:#fff;border:1px solid #991B1B;border-radius:6px;padding:3px 10px;cursor:pointer;font-weight:600}
.bshow:hover{background:#991B1B;color:#fff}
.brow .card{margin:10px 0 0}
.refresh{font-size:12px;color:var(--muted);margin-top:18px}
.keys{font-size:12px;color:var(--muted);margin-top:8px}
.keys b{font-weight:600;color:#3a443e;font-family:ui-monospace,Menlo,monospace}
</style></head><body>
<header><h1>LendPaper · Staging launchpad</h1>
<p>Most-current <strong>unpublished</strong> work — auto-discovered from <code>~/lp-worktrees/</code>. The live <code>main</code> mirror is hidden. {{N}} in flight.</p>
<div class="prog"><div class="prog-track"><div id="progfill"></div></div><span id="proglabel"></span></div></header>
<div class="wrap">
<div class="filters" id="filters"></div>
<div class="clearcard" id="clear" hidden><b>Queue clear.</b><span>Every worktree reviewed. Nothing waiting on you.</span></div>
<div id="cards"></div>
<div id="blocked" hidden><div class="blocked-title">Out of date — predates the 6/11 open-access design</div><div id="brows"></div></div>
<div class="refresh">{{RETIRED}}</div>
<div class="refresh">Auto-discovered on load — new worktrees appear, merged/removed ones drop off. Reload to refresh.</div>
<div class="keys"><b>j</b>/<b>k</b> move · <b>a</b> approve · <b>w</b> needs work · <b>x</b> reject · <b>p</b> preview first page</div>
</div>
<script>
"use strict";
const ROWS = {{DATA}};
const ACTIVE = ROWS.filter(r=>r.epoch_ok);     // the review queue
const BLOCKED = ROWS.filter(r=>!r.epoch_ok);   // predate DESIGN_EPOCH — bottom section only
const TODAY = new Date();
const TAGS = ["pending","finished","priority","monetize"];
const FILTERS = [["all","All"],["priority","Priority"],["pending","Pending"],
  ["finished","Finished"],["monetize","Monetize"],["needswork","Needs work"],
  ["rejected","Rejected"],["outdated","Out of date"]];
let filter = "all";
ROWS.forEach((r,i)=>{ r._i = i; r._pv = {}; });
function isStale(r){
  if(!r.epoch_ok) return false;
  const age = r.base ? (TODAY - new Date(r.base)) / 864e5 : 0;
  return r.behind >= 10 || age > 3;
}

function el(tag, cls, text){
  const e = document.createElement(tag);
  if(cls) e.className = cls;
  if(text != null) e.textContent = text;
  return e;
}
function matches(r, f){
  if(f === "all") return true;
  if(f === "pending") return r.status === "pending" && !r.tags.includes("finished");
  if(f === "needswork") return r.status === "needs-work";
  if(f === "rejected") return r.status === "rejected";
  return r.tags.includes(f);
}
function group(r){
  if(r.status === "rejected") return 4;
  if(r.tags.includes("finished")) return 3;
  if(r.status === "needs-work") return 2;
  if(r.tags.includes("priority")) return 0;
  return 1;
}
function pagesOf(r){ return r.htmls.length ? r.htmls : ["/"]; }

function post(r, patch){
  fetch("/api/state", {method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify(Object.assign({name:r.name}, patch))}).catch(()=>{});
}
function setStatus(r, s){
  const next = r.status === s ? "pending" : s;
  const celebrate = next === "approved";
  r.status = next;
  post(r, {status: next});
  updateAll();
  if(celebrate) confetti(r._card);
}
function toggleTag(r, t){
  r.tags = r.tags.includes(t) ? r.tags.filter(x=>x!==t) : r.tags.concat(t);
  post(r, {tags: r.tags});
  updateAll();
}
function setCheck(r, id, on){
  if(on) r.checks[id] = true; else delete r.checks[id];
  post(r, {checks: {[id]: on}});
  updateAll();
}
function togglePreview(r, p, pi){
  let pv = r._pv[pi];
  if(!pv){
    pv = el("div","pv");
    const bar = el("div","pvbar");
    bar.append(el("span", null, p));
    const x = el("button","pvclose","Close");
    x.addEventListener("click", ()=>{ pv.style.display = "none"; });
    bar.append(x);
    const ifr = document.createElement("iframe");
    ifr.src = "http://localhost:" + r.port + "/" + p.replace(/^\\//, "");
    pv.append(bar, ifr);
    r._card.querySelector(".previews").append(pv);
    r._pv[pi] = pv;
  }else{
    pv.style.display = pv.style.display === "none" ? "" : "none";
  }
}
function confetti(card){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const cols = ["#1A3C2E","#2D6A4F","#8FBCA3"];
  const c = el("div","confetti");
  for(let i=0;i<12;i++){
    const s = el("i");
    s.style.left = (6 + Math.random()*88) + "%";
    s.style.background = cols[i % 3];
    s.style.animationDelay = (Math.random()*120) + "ms";
    c.append(s);
  }
  card.append(c);
  setTimeout(()=>c.remove(), 1000);
}

function buildCard(r){
  const card = el("div","card");
  card.tabIndex = -1;
  card.dataset.name = r.name;
  // slim row shown when finished-collapsed; click to peek
  const slim = el("div","slim");
  slim.append(el("span","slim-name", r.name), el("span","slim-branch", r.branch),
              el("span","slim-kicker",""));
  slim.addEventListener("click", ()=>card.classList.toggle("peek"));
  const full = el("div","full");
  if(!r.epoch_ok){
    full.append(el("div","blockband",
      "OUT OF DATE — built on the pre-open-access design. Rebase before any rollout."));
  }else if(isStale(r)){
    full.append(el("div","warnband", "Based on main from " + r.base + " — " + r.behind +
      " commits behind. Verify against the live site before approving."));
  }
  const top = el("div","top");
  if(r.ticket){
    const a = el("a","ticket", r.ticket);
    a.href = "https://linear.app/lendpaper/issue/" + r.ticket;
    a.target = "_blank"; a.rel = "noopener";
    top.append(a);
  }
  top.append(el("span","branch", r.branch), el("span","port", ":" + r.port), el("span","kicker",""));
  full.append(top, el("div","wt", r.name));
  const goal = el("div","goal");
  goal.append(el("div","goal-k","SHOULD ACCOMPLISH"));
  const gt = el("div","goal-t", r.goal || "(no goal recorded)");
  if(r.goal_src === "commit") gt.append(el("span","goal-src"," (from last commit)"));
  else if(r.requested) gt.append(el("span","goal-src"," · requested " + r.requested));
  goal.append(gt);
  full.append(goal);
  const ch = r.changed.slice(0,8).join(", ") + (r.changed.length > 8 ? " …" : "");
  full.append(el("div","changed", ch || "no diff vs main"));
  full.append(el("div","meta", "last commit " + r.last + " · branched from main of " + r.base +
    (r.behind ? " · " + r.behind + " behind main" : " · current with main")));
  if(r.behind && r.missing && r.missing.length){
    const nw = el("div","newer");
    nw.append(el("div","newer-k","PREVIEW MAY LAG MAIN — newer on main since this branched:"));
    r.missing.forEach(s=> nw.append(el("div","newer-i","· " + s)));
    if(r.behind > r.missing.length)
      nw.append(el("div","newer-i","· … and " + (r.behind - r.missing.length) + " more"));
    full.append(nw);
  }
  const checks = el("div","checks");
  checks.append(el("div","checks-k","WHAT TO CHECK"));
  r.tips.forEach(t=>{
    const lab = el("label","check");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!r.checks[t.id];
    cb.addEventListener("change", ()=>setCheck(r, t.id, cb.checked));
    lab.append(cb, el("span", null, t.text));
    checks.append(lab);
  });
  full.append(checks);
  const links = el("div","links");
  pagesOf(r).forEach((p, pi)=>{
    const g = el("span","linkgroup");
    const a = el("a", null, (p === "/" ? "/ (root)" : p) + " ↗");
    a.href = "http://localhost:" + r.port + "/" + p.replace(/^\\//, "");
    a.target = "_blank"; a.rel = "noopener";
    const b = el("button","pv-toggle","Preview");
    b.addEventListener("click", ()=>togglePreview(r, p, pi));
    g.append(a, b);
    links.append(g);
  });
  full.append(links, el("div","previews"));
  const act = el("div","actions");
  const chips = el("div","chips");
  TAGS.forEach(t=>{
    const c = el("button","chip", t);
    c.dataset.tag = t;
    c.addEventListener("click", ()=>toggleTag(r, t));
    chips.append(c);
  });
  const btns = el("div","btns");
  const nudge = el("span","nudge","All checks done.");
  nudge.hidden = true;
  btns.append(nudge);
  const rj = el("button","btn reject","Reject");
  rj.addEventListener("click", ()=>setStatus(r,"rejected"));
  const ap = el("button","btn approve","Approve");
  ap.addEventListener("click", ()=>setStatus(r,"approved"));
  const nw = el("button","btn needsw","Needs work");
  nw.addEventListener("click", ()=>setStatus(r,"needs-work"));
  btns.append(ap, nw, rj);
  act.append(chips, btns);
  full.append(act);
  card.append(slim, full);
  r._card = card;
  return card;
}

function updateCard(r){
  const c = r._card;
  if(!c) return;  // blocked card not yet expanded via Show anyway
  c.classList.toggle("approved", r.status === "approved");
  c.classList.toggle("needswork", r.status === "needs-work");
  c.classList.toggle("rejected", r.status === "rejected");
  c.classList.toggle("finished", r.tags.includes("finished"));
  if(!r.tags.includes("finished")) c.classList.remove("peek");
  const k = r.status === "approved" ? "APPROVED — READY TO MERGE"
          : r.status === "needs-work" ? "NEEDS WORK"
          : r.status === "rejected" ? "REJECTED" : "";
  c.querySelector(".kicker").textContent = k;
  c.querySelector(".slim-kicker").textContent = k || "FINISHED";
  c.querySelectorAll(".chip").forEach(ch=>ch.classList.toggle("on", r.tags.includes(ch.dataset.tag)));
  const done = r.tips.length > 0 && r.tips.every(t=>r.checks[t.id]);
  c.querySelector(".nudge").hidden = !(done && r.status === "pending");
  if(!r.epoch_ok) return;  // blocked cards live in their own section — no filters/ordering
  c.style.order = group(r) * 1000 + r._i;
  c.style.display = (filter !== "outdated" && matches(r, filter)) ? "" : "none";
}

function updateAll(){
  ROWS.forEach(updateCard);
  FILTERS.forEach(([f, label])=>{
    const n = f === "outdated" ? BLOCKED.length : ACTIVE.filter(r=>matches(r, f)).length;
    const b = document.querySelector('[data-f="' + f + '"]');
    b.textContent = label + " (" + n + ")";
    b.classList.toggle("on", filter === f);
  });
  const reviewed = ACTIVE.filter(r=>r.status === "approved" || r.status === "rejected"
                                  || r.tags.includes("finished")).length;
  document.getElementById("progfill").style.width = ACTIVE.length ? (100 * reviewed / ACTIVE.length) + "%" : "0";
  document.getElementById("proglabel").textContent = reviewed + " of " + ACTIVE.length + " reviewed";
  const pendingLeft = ACTIVE.filter(r=>r.status === "pending" && !r.tags.includes("finished")).length;
  document.getElementById("clear").hidden = filter === "outdated" || !(ACTIVE.length && pendingLeft === 0);
  document.getElementById("blocked").hidden = !BLOCKED.length;
}

function visibleSorted(){
  if(filter === "outdated") return [];
  return ACTIVE.filter(r=>matches(r, filter))
               .sort((a,b)=>(group(a)*1000 + a._i) - (group(b)*1000 + b._i));
}
document.addEventListener("keydown", e=>{
  if(e.metaKey || e.ctrlKey || e.altKey) return;
  if(e.target.closest && e.target.closest("input,textarea,select")) return;
  const vis = visibleSorted();
  if(!vis.length) return;
  const cur = document.activeElement && document.activeElement.closest
            ? document.activeElement.closest(".card") : null;
  if(e.key === "j" || e.key === "k"){
    let i = vis.findIndex(r=>r._card === cur);
    if(i < 0) i = e.key === "j" ? -1 : vis.length;
    i = e.key === "j" ? Math.min(i + 1, vis.length - 1) : Math.max(i - 1, 0);
    vis[i]._card.focus();
    vis[i]._card.scrollIntoView({block:"nearest"});
    e.preventDefault();
  }else if(e.key === "a" || e.key === "w" || e.key === "x" || e.key === "p"){
    const r = vis.find(r=>r._card === cur);
    if(!r) return;
    if(e.key === "a") setStatus(r, "approved");
    else if(e.key === "w") setStatus(r, "needs-work");
    else if(e.key === "x") setStatus(r, "rejected");
    else togglePreview(r, pagesOf(r)[0], 0);
    e.preventDefault();
  }
});

const fbar = document.getElementById("filters");
FILTERS.forEach(([f])=>{
  const b = el("button","fbtn");
  b.dataset.f = f;
  b.addEventListener("click", ()=>{ filter = f; updateAll(); });
  fbar.append(b);
});
function buildBlockedRow(r){
  const row = el("div","brow");
  const line = el("div","brow-line");
  line.append(el("span","slim-branch", r.branch));
  if(r.ticket){
    const a = el("a","ticket", r.ticket);
    a.href = "https://linear.app/lendpaper/issue/" + r.ticket;
    a.target = "_blank"; a.rel = "noopener";
    line.append(a);
  }
  line.append(el("span","brow-goal", r.goal),
              el("span","brow-meta", "last commit " + r.last + " · base " + (r.base || "?") +
                " · " + r.behind + " behind"));
  const b = el("button","bshow","Show anyway");
  b.addEventListener("click", ()=>{
    if(!r._card){ row.append(buildCard(r)); updateCard(r); }
    else r._card.hidden = !r._card.hidden;
    b.textContent = r._card.hidden ? "Show anyway" : "Hide";
  });
  line.append(b);
  row.append(line);
  return row;
}

const wrap = document.getElementById("cards");
if(ACTIVE.length) ACTIVE.forEach(r=>wrap.append(buildCard(r)));
else wrap.append(el("div","empty","No in-flight worktrees found under ~/lp-worktrees/."));
const brows = document.getElementById("brows");
BLOCKED.forEach(r=>brows.append(buildBlockedRow(r)));
updateAll();
</script>
</body></html>"""


def main():
    print(f"LendPaper staging launchpad → http://localhost:{BASE_PORT}/")
    print("Discovering worktrees under ~/lp-worktrees/ … (Ctrl-C to stop)")
    httpd = socketserver.ThreadingTCPServer(("", BASE_PORT), LaunchpadHandler)
    httpd.daemon_threads = True
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nbye")


if __name__ == "__main__":
    main()
