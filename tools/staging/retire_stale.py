#!/usr/bin/env python3
"""Auto-retire out-of-date staging cards (LEN-323).

Runs headless every 4 hours via ~/Library/LaunchAgents/com.lendpaper.launchpad-retire.plist
(zero Claude tokens — the classification is deterministic). A card is retired when the
launchpad would block it as "Out of date": its merge-base with origin/main predates
DESIGN_EPOCH. launchpad.py owns that logic; this script imports it, never re-implements it.

Never auto-retires a card Steve marked approved or tagged priority — those are logged
as skipped instead. Retirement is reversible: flip "retired" off in
~/lp-worktrees/.launchpad-state.json (or POST to /api/state). Every run appends to
~/lp-worktrees/.launchpad-retire.log.

Usage: retire_stale.py [--dry-run]
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import launchpad

LOG_PATH = os.path.join(launchpad.WORKTREE_ROOT, ".launchpad-retire.log")
API_URL = f"http://localhost:{launchpad.BASE_PORT}/api/state"


def server_up():
    try:
        urllib.request.urlopen(f"http://localhost:{launchpad.BASE_PORT}/", timeout=3)
        return True
    except Exception:
        return False


def post_retire(name):
    req = urllib.request.Request(
        API_URL,
        data=json.dumps({"name": name, "retired": True}).encode(),
        headers={"Content-Type": "application/json"})
    urllib.request.urlopen(req, timeout=5)


def main():
    dry = "--dry-run" in sys.argv
    # judge staleness against the real origin/main, not a stale ref; worktrees share
    # refs with the anchor repo, so one fetch covers all of them. Failure (offline,
    # no ssh agent under launchd) degrades to the last-fetched ref — acceptable.
    launchpad.sh(["git", "fetch", "origin", "main"], cwd=launchpad.REPO_ANCHOR)

    state = launchpad.load_state()
    rows = launchpad.discover()
    if not rows:
        # the repo always has in-flight worktrees; zero rows means git itself failed —
        # under launchd that's TCC blocking ~/Documents (where the primary repo's .git
        # lives). One-time fix: System Settings → Privacy & Security → Full Disk
        # Access → add /usr/bin/python3.
        warn = (datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
                + " WARNING: discover() saw no worktrees — git blocked (launchd needs "
                  "Full Disk Access for /usr/bin/python3); sweep skipped")
        with open(LOG_PATH, "a") as f:
            f.write(warn + "\n")
        print(warn)
        return

    retired, skipped = [], []
    for row in rows:
        name = os.path.basename(row["path"])
        entry = state.get(name) if isinstance(state.get(name), dict) else {}
        if row["epoch_ok"] or entry.get("retired"):
            continue
        if entry.get("status") == "approved" or "priority" in entry.get("tags", []):
            skipped.append(name)
            continue
        retired.append(name)

    if not dry and retired:
        if server_up():
            for name in retired:
                post_retire(name)
        else:
            for name in retired:
                entry = state.get(name)
                if not isinstance(entry, dict):
                    entry = state[name] = {}
                entry["retired"] = True
            launchpad.save_state(state)

    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    mode = "DRY-RUN" if dry else "retired"
    line = (f"{stamp} {mode}: {', '.join(retired) or '(nothing out of date)'}"
            + (f" | skipped (approved/priority): {', '.join(skipped)}" if skipped else ""))
    with open(LOG_PATH, "a") as f:
        f.write(line + "\n")
    print(line)


if __name__ == "__main__":
    main()
