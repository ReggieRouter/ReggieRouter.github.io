# Handoff — calculator routing & shareability

## The change

Calculators currently open in modals with no URL. Give each one a real, shareable route. Keep the modal for quick tools, but let heavier tools open as full pages — same calculator either way.

Each calc already lives as its own file, so it becomes a route that renders in two contexts from one shared shell.

## Behavior

- `/tools/dscr` is a real, shareable, bookmarkable URL.
- Land on it directly → calc renders as a full page (good for shared links and SEO).
- Open it from the homepage → renders in its default shell (modal or page, see below), and the URL quietly updates to the tool's slug.
- Close the modal → URL returns to `/`.
- Back button → closes the modal.

The homepage design does not change. Each card links to the tool's slug instead of triggering a URL-less modal.

## Per-tool presentation

Not every tool fits a modal. Quick-input tools (DSCR, APR) stay modals — fast in, fast out, back to the hub. Long-output tools (amo schedule throws a full table) open as full pages so they have room to breathe.

Add a `presentation` flag to the registry so it's explicit and every surface agrees:

```ts
{ id: "dscr", name: "DSCR calculator", status: "live", slug: "/tools/dscr", presentation: "modal" },
{ id: "amo",  name: "Amo schedule",    status: "live", slug: "/tools/amo",  presentation: "page" },
```

A direct URL load always renders the full page regardless of flag — the flag only governs how the tool opens *from the homepage*.

## Design consistency — the one rule that protects it

The calculator is **one component** — same inputs, outputs, spacing, buttons, brand styling — rendered inside whatever shell it's handed. The modal and the page are just frames around an identical picture.

To keep the two frames from drifting:

- **Define the shared container once** — max content width, padding rhythm, header treatment, close/back affordance, footer. Both the modal and the page import it. No one hand-styles the full-page version separately.
- The page version is the modal's contents dropped onto a centered page **at the same width**, with the homepage chrome (sidebar, search) still around it.
- Same picture, bigger frame. That's the whole principle.

## Prefill (design now, build later)

Once tools have URLs, inputs can be shared pre-filled — `/tools/dscr?noi=180000&debt=120000`. A broker runs a scenario, sends the link, the recipient sees the exact numbers. Strong referral loop and B2B demo. Don't build for launch, but design the route so it's easy to add.

## Hard rule — no PII in URLs

Prefill is fine for generic numbers (NOI, rate, term). Never put borrower-identifying data in a URL — names, EINs, addresses. URLs leak into history, logs, and referrer headers. The `registry` tool's `--name`/`--ein` inputs must never be serialized into a shareable link.
