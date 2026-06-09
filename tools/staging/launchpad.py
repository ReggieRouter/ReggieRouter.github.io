#!/usr/bin/env python3
"""
LendPaper staging launchpad — one URL to preview every in-flight, unpublished branch.

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
"""
import functools
import http.server
import os
import re
import socketserver
import subprocess
import threading

BASE_PORT = int(os.environ.get("LP_STAGING_PORT", "8780"))
WORKTREE_ROOT = os.path.expanduser("~/lp-worktrees")
# `git worktree list` must run from inside the repo; the script always lives in a worktree.
REPO_ANCHOR = os.path.dirname(os.path.abspath(__file__))

_servers = {}          # path -> (port, thread)
_lock = threading.Lock()


def sh(args, cwd=None):
    try:
        return subprocess.run(args, cwd=cwd, capture_output=True, text=True, timeout=15).stdout.strip()
    except Exception:
        return ""


def discover():
    """Return [{path, branch, ticket, changed}] for every worktree except the main mirror."""
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
        committed = sh(["git", "diff", "--name-only", "origin/main...HEAD"], cwd=path)
        dirty = sh(["git", "status", "--porcelain"], cwd=path)
        changed = sorted({*(committed.splitlines()),
                          *(l[3:] for l in dirty.splitlines() if len(l) > 3)})
        m = re.search(r"len-(\d+)", branch, re.I)
        ticket = f"LEN-{m.group(1)}" if m else ""
        result.append({"path": path, "branch": branch, "ticket": ticket, "changed": changed})
    result.sort(key=lambda r: r["path"])
    return result


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


def index_html(rows):
    cards = []
    for r in rows:
        name = os.path.basename(r["path"])
        port = r["port"]
        # link to the changed HTML pages first; else the worktree root
        htmls = [c for c in r["changed"] if c.endswith(".html")]
        links = htmls or ["/"]
        link_html = "".join(
            f'<a href="http://localhost:{port}/{p.lstrip("/")}" target="_blank" rel="noopener">{esc(p)} ↗</a>'
            for p in links)
        changed = ", ".join(r["changed"][:8]) + (" …" if len(r["changed"]) > 8 else "")
        ticket = f'<span class="ticket">{esc(r["ticket"])}</span>' if r["ticket"] else ""
        cards.append(f"""<div class="card">
          <div class="top">{ticket}<span class="branch">{esc(r["branch"])}</span>
            <span class="port">:{port}</span></div>
          <div class="wt">{esc(name)}</div>
          <div class="changed">{esc(changed) or "no diff vs main"}</div>
          <div class="links">{link_html}</div>
        </div>""")
    body = "".join(cards) or '<div class="empty">No in-flight worktrees found under ~/lp-worktrees/.</div>'
    return TEMPLATE.replace("{{BODY}}", body).replace("{{N}}", str(len(rows)))


def esc(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


class LaunchpadHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_GET(self):
        rows = discover()
        for r in rows:
            r["port"] = ensure_server(r["path"])
        html = index_html(rows).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(html)))
        self.end_headers()
        self.wfile.write(html)


TEMPLATE = """<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LendPaper · Staging launchpad</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='5' fill='%231A3C2E'/%3E%3Cpath d='M4 4v16h11l5-5V4H4z' fill='none' stroke='white' stroke-width='2.5'/%3E%3C/svg%3E">
<style>
:root{--brand:#1A3C2E;--mid:#2D6A4F;--bg:#F7F8F7;--border:#e3e7e4;--muted:#6b746f}
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:#1c2420}
header{background:var(--brand);color:#fff;padding:20px 28px}header h1{margin:0;font-size:19px}header p{margin:6px 0 0;font-size:13px;opacity:.82}
.wrap{max-width:960px;margin:0 auto;padding:22px 20px 60px}
.card{background:#fff;border:1px solid var(--border);border-radius:12px;padding:14px 17px;margin-bottom:13px}
.top{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.ticket{font-weight:700;font-size:12px;color:#fff;background:var(--mid);border-radius:5px;padding:2px 8px}
.branch{font-family:ui-monospace,Menlo,monospace;font-size:12px;color:var(--brand)}
.port{font-size:11.5px;color:var(--muted)}
.wt{font-size:15px;font-weight:600;margin:9px 0 3px}
.changed{font-size:12px;color:var(--muted);font-family:ui-monospace,Menlo,monospace}
.links{display:flex;flex-wrap:wrap;gap:8px;margin-top:11px}
.links a{font-size:13px;text-decoration:none;color:var(--brand);background:#fff;border:1px solid var(--brand);border-radius:7px;padding:6px 11px;font-weight:600}
.links a:hover{background:var(--brand);color:#fff}
.empty{color:var(--muted);font-size:14px;padding:14px 0}
.refresh{font-size:12px;color:var(--muted);margin-top:18px}
</style></head><body>
<header><h1>LendPaper · Staging launchpad</h1>
<p>Most-current <strong>unpublished</strong> work — auto-discovered from <code>~/lp-worktrees/</code>. The live <code>main</code> mirror is hidden. {{N}} in flight.</p></header>
<div class="wrap">{{BODY}}
<div class="refresh">Auto-discovered on load — new worktrees appear, merged/removed ones drop off. Reload to refresh.</div>
</div></body></html>"""


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
