# Handoff: West Virginia Reinstatement Modal
**Route:** Registry → Reinstatement  
**Execution target:** Claude Code  
**Status:** Design finalized, ready to implement

---

## What this is

A modal triggered on the reinstatement route of the registry flow. It explains what reinstatement is, why it matters, and gives state-specific filing directions. It is designed to serve lenders, brokers, and business owners from a single piece of copy — no audience branching required.

---

## Visual spec

### Modal container
```
background: #1c1c26
border: 0.5px solid rgba(255,255,255,0.10)
border-radius: 16px
padding: 1.75rem 1.75rem 1.5rem
max-width: 460px
position: relative
```

### Title
```
text: "West Virginia Reinstatement"
color: #ffffff
font-size: 19px
font-weight: 500
margin-bottom: 1rem
```

### Badges (row, gap 8px, margin-bottom 1.5rem)

**Timeline badge**
```
label: "1–2 WEEKS"
background: rgba(220,80,80,0.15)
color: #e08080
font-size: 11px
font-weight: 600
letter-spacing: 0.5px
padding: 4px 10px
border-radius: 5px
```

**Method badge**
```
label: "ONLINE PORTAL"
background: rgba(30,160,100,0.15)
color: #4ecb8f
font-size: 11px
font-weight: 600
letter-spacing: 0.5px
padding: 4px 10px
border-radius: 5px
```

### Value prop paragraph
```
color: rgba(255,255,255,0.50)
font-size: 13.5px
line-height: 1.65
margin-bottom: 1.5rem
```

**Copy — do not alter wording:**
> A lapse in good standing doesn't have to be a dealbreaker. Most businesses can be reinstated well within a typical decision window — changing the outcome for everyone involved.

**Why this copy is written this way:** "Dealbreaker" and "decision window" are intentional. They register as lending/brokerage language for those audiences without alienating business owners reading the same sentence. Do not simplify or generalize this language.

### Steps card
```
background: rgba(255,255,255,0.04)
border: 0.5px solid rgba(255,255,255,0.08)
border-radius: 10px
padding: 1.25rem
```

**Card label**
```
text: "State-specific directions"
font-size: 10.5px
font-weight: 600
color: rgba(255,255,255,0.28)
letter-spacing: 0.7px
text-transform: uppercase
margin-bottom: 1rem
```

**Step items** (flex column, gap 14px)

Each step: flex row, gap 12px, align-items flex-start

Step number bubble:
```
width: 22px
height: 22px
border-radius: 50%
background: rgba(255,255,255,0.06)
color: rgba(255,255,255,0.40)
font-size: 11px
font-weight: 600
display: flex
align-items: center
justify-content: center
flex-shrink: 0
margin-top: 1px
```

Step text:
```
color: rgba(255,255,255,0.78)
font-size: 14px
line-height: 1.55
```

**Step 1 copy:** Get Tax Clearance from the State Tax Dept., Workforce WV, and Unemployment.  
**Step 2 copy:** File a Reinstatement with the SOS (One Stop).

### Close button
```
position: absolute
top: 1.25rem
right: 1.25rem
background: none
border: none
icon color: rgba(255,255,255,0.30)
icon size: 18px
aria-label: "Close"
```

---

## Hierarchy rationale (do not collapse or reorder)

1. **Title** — establishes state and action
2. **Badges** — carry urgency (speed) and accessibility (online) without requiring copy to repeat them
3. **Value prop** — single paragraph, no container/card. This is intentional. It must not be wrapped in a box or visually equated with the steps card.
4. **Steps card** — the only box in the modal. Dominant by design. This is what the user acts on.

A previous version had two stacked boxes (a callout + steps). That pattern was removed because equal visual weight implied equal importance. The steps are what matters; everything above sets context.

---

## What Claude Code should deliver

- Implement as a modal component on the reinstatement registry route
- Match dark surface tokens exactly — do not substitute with global theme defaults if they differ
- Copy is final. Do not paraphrase, simplify, or run through a content pass
- Close button should dismiss the modal and return user to the registry route
- No additional CTAs, links, or actions inside the modal at this time
