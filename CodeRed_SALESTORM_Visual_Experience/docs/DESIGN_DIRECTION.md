# DESIGN DIRECTION

## Visual Concept

Engineering field manual meets modern editorial visualization.
The site explains the CodeRed SALESTORM architecture through purposeful diagrams,
precise typography, and scroll-driven storytelling. Every visual element serves
the architecture narrative.

Think: architecture review document, control-room clarity, technical publication.

## Palette

```
--paper:        #F2F0E9    Background / reading surface
--paper-deep:   #E8E4DA    Section dividers / card backgrounds
--ink:          #101B27    Primary text / architecture elements
--ink-soft:     #384451    Secondary text
--codered:      #C63D32    Pressure / failure / request contention / brand accent
--safe:         #2F6E52    Confirmed / valid / invariant held / recovery success
--warning:      #AF7625    UNKNOWN / payment uncertainty / reconciliation
--steel:        #7D8790    Inactive systems / metadata
--line:         #D1CCC1    Borders / rules
--white:        #FCFBF8    Clean panels
```

Color semantics are strictly enforced:
- Red = pressure, contention, failure, CodeRed identity
- Green = confirmed, invariant held, recovery complete
- Amber = UNKNOWN, waiting, reconciliation
- Ink/navy = architecture, text, authoritative systems
- Steel = inactive, secondary

## Typography

- **Headings**: IBM Plex Sans (bundled via Fontsource)
- **Body**: IBM Plex Sans, 16px base, 1.6 line height
- **Monospace**: IBM Plex Mono for counters, invariants, SQL, events, state labels
- System font fallback stack for resilience

Monospace is used selectively. Body copy is never monospaced.

## Grid

- Desktop: 12-column grid, max-width ~1200px with generous margins
- Content uses asymmetric compositions — diagrams wide, copy narrower
- Not everything is centered
- Body copy lines limited to ~65ch for readability
- Large negative space used deliberately

## Interaction Style

- Scroll-driven storytelling using GSAP ScrollTrigger
- Pinned sections for Architecture and Critical Section only
- No aggressive scroll hijacking
- Anchor navigation with smooth scroll (Lenis)
- Interactive toggles for Jury Lab scenarios and Order recovery demo
- The 100-unit inventory grid is a recurring visual motif

## Animation Roles

1. **System causality**: Show where requests go, what changed, what failed
2. **Narrative emphasis**: Draw attention to the critical insight
3. **Microinteraction**: Button states, hover feedback
4. **Decoration**: Minimal — only the request particle field

Motion rules:
- Every animation must explain something
- No generic fade-up-on-everything
- SVG line drawing for architecture activation
- Grid state transitions for inventory
- Counter progression for evidence
- Queue accumulation/draining for recovery

## Avoided AI-Design Clichés

- ✗ Purple-to-blue gradients
- ✗ Cyan neon glows
- ✗ Hero badge above headline
- ✗ Giant gradient headline
- ✗ Two generic CTA buttons
- ✗ Glowing gradient sphere / 3D blob
- ✗ Floating fake dashboard
- ✗ Bento grid layout
- ✗ Every section as six cards
- ✗ Fake testimonials / company logos
- ✗ Sparkle icons
- ✗ Excessive gradient text
- ✗ Arbitrary background meshes
- ✗ Fade-up on every element
- ✗ Stock / generated server-room imagery
- ✗ Pills and 24px+ radii everywhere
- ✗ Glass cards

## What IS Used

- ✓ Editorial rules and thin borders
- ✓ 0–4px corner radii
- ✓ Flat surfaces with whitespace
- ✓ Strong typographic scale changes
- ✓ Custom SVG architecture diagrams
- ✓ The 100-unit grid as visual identity
- ✓ Deterministic state transitions
- ✓ Technical copy written like an engineering team
