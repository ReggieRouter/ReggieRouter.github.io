# Staging launchpad

One URL to preview every in-flight, **unpublished** branch at its most current state.

```bash
python3 tools/staging/launchpad.py
# → http://localhost:8780/
```

## How it works

- Auto-discovers every git worktree via `git worktree list` (we keep one worktree
  per feature branch under `~/lp-worktrees/`).
- Serves each worktree as a static site on its own port (root-absolute asset paths
  like `/public`, `/js` only resolve when each is served at its own root).
- Renders an index linking to the changed `.html` pages in each, tagged with the
  branch and parsed `LEN-###` ticket.
- The live **`main`** mirror is skipped.

## Lifecycle — nothing to maintain

There is **no manifest**. A feature shows up when its worktree exists and **drops
off automatically** once it merges and you remove the worktree:

```bash
git worktree remove ~/lp-worktrees/len-xxx
```

New worktrees are picked up on the next page reload (no restart needed).

## Future upgrade (optional)

For **shareable** URLs (not just localhost), wire hosted per-PR deploy previews
(Netlify/Cloudflare Pages) — each PR gets a unique URL, auto-built on push and
torn down on merge. Left out for now because production is GitHub Pages from
`main` and we don't want to muddy that; this local launchpad covers the
day-to-day "show me current unpublished work" need with zero infra.
