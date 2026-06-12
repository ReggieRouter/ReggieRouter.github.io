// STAGING-ONLY MODULE — never merged to prod main. Loaded exclusively by the
// hostname-gated block in analytics.js (only on *.github.io), so even if a
// reference leaked to lendpaper.com, this file wouldn't load there.
//
// Purpose (Steve 6/12): the demo env mirrors live + every in-flight branch.
// Each home tile gets a subtle flag showing how many updates it carries in
// this build, with a tooltip listing them. Maintained by hand on every
// staging refresh — see the runbook in memory/feedback_demo_env_process.md:
//   - add entries when a branch is merged into the staging branch
//   - REMOVE entries once that branch ships to prod main
//   - tools not yet registered in tools.js can be injected as demo tiles
//     via an `inject` entry (e.g. a brand-new underwriting tool).

const STAGING_UPDATES = {
  // tool id (tools.js data-id) → updates in THIS staging build, not yet live
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

// Tools in staging that aren't registered in tools.js yet — rendered as extra
// demo tiles at the end of the named category grid. (None right now; when a
// new tool like the in-progress underwriting build lands in staging, add:)
// { id:"underwriting", name:"Underwriting", desc:"…", href:"/underwriting.html",
//   cat:"riskCards", updates:[{ticket:"LEN-…", label:"initial build"}] }
const INJECT_TILES = [];

function tipText(updates) {
  return "In this staging build:\n" +
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
    const flag = document.createElement("sup");
    flag.className = "lp-stage-flag";
    flag.textContent = " +" + ups.length;
    flag.title = tipText(ups);
    flag.style.cssText =
      "font:700 10px/1 ui-monospace,Menlo,monospace;color:#1A3C2E;" +
      "background:#edf2eb;border:1px solid #d7e2d9;border-radius:5px;" +
      "padding:1px 4px;margin-left:6px;vertical-align:super;cursor:help";
    // a <sup> inside the tile link: hover shows the native tooltip; click
    // still opens the tool (it's the same anchor).
    name.appendChild(flag);
    card.title = tipText(ups);
  });
  INJECT_TILES.forEach(t => {
    const grid = document.querySelector("#" + t.cat + " .cards");
    if (!grid || grid.querySelector('[data-id="' + t.id + '"]')) return;
    const a = document.createElement("a");
    a.href = t.href; a.className = "card"; a.dataset.id = t.id;
    a.title = tipText(t.updates);
    a.innerHTML = '<div class="card-body"><div class="card-name">' + t.name +
      ' <sup class="lp-stage-flag" style="font:700 10px/1 ui-monospace,Menlo,monospace;color:#1A3C2E;background:#edf2eb;border:1px solid #d7e2d9;border-radius:5px;padding:1px 4px">+' +
      t.updates.length + '</sup></div><div class="card-desc">' + t.desc + "</div></div>";
    grid.appendChild(a);
  });
  return true;
}

// tiles render via JS after load — retry briefly until they exist
let tries = 0;
const timer = setInterval(() => {
  if (decorate() || ++tries > 20) clearInterval(timer);
}, 300);

export { STAGING_UPDATES };
