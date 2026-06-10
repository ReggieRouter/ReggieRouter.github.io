/* ============================================================
   LendPaper — Homepage greeting name-hooks (LEN-164)
   Single source of truth. Loaded by index.html (the live greeting).
   {name} is swapped for the user's first name; a null `sub` means
   "fall back to a random phrase-bank tagline."
   ============================================================ */
(function (g) {
  g.LP_NAME_GREETINGS = [
    { text: "Hi {name}.", sub: "What are you closing today?" },
    { text: "{name}, let's build proposals that close.", sub: null },
    { text: "Welcome back, {name}.", sub: "Who are you funding today?" },
    { text: "Let's get one closed, {name}.", sub: "Your next deal is one conversation away." },
    { text: "{name} — time to move some money.", sub: null },
    { text: "Good to see you, {name}.", sub: "Every file has a story. What's today's?" },
    { text: "Ready when you are, {name}.", sub: "Let's find the right structure." },
    { text: "Back at it, {name}.", sub: "Clarity closes." },
    { text: "{name}, let's put a deal together.", sub: null },
    { text: "Let's make it bankable, {name}.", sub: null },
    { text: "{name}, who's getting funded today?", sub: null },
    { text: "Let's win this one, {name}.", sub: "Sharp numbers, clean proposal." }
  ];
})(typeof window !== 'undefined' ? window : this);
