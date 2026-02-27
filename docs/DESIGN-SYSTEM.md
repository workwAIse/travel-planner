# Brand & Design Language System
## travel-planner-smoky-seven.vercel.app

---

## Context

The app is an AI-powered travel planner that turns raw itinerary notes into a visual, navigable trip experience (photos, maps, weather, categorized stops). It has genuine aesthetic bones — a warm terracotta/cream/espresso palette and an editorial serif — but lacks a coherent brand identity, a name beyond "Travel Planner", and a fully resolved design system. This document defines the complete brand language to take it from "pretty prototype" to "high-end product."

---

## 1. Brand Audit — What's Already Good

| Element | Current State | Assessment |
|---|---|---|
| Color palette | Warm cream + terracotta + espresso | ✅ Distinctive, warm, not generic travel blue |
| Display font | DM Serif Display | ✅ Editorial, humanist, premium |
| Radius | 14px globally | ✅ Generous, friendly, modern |
| Hero treatment | Full-bleed destination photo behind trip title | ✅ High impact, magazine-quality |
| Dark mode | Implemented, near-black warm tone (#120b07) | ✅ Correct — warm dark, not cold grey |
| AI UX | Sparkle icon on "Create trip" CTA | ✅ Clear AI affordance |
| Trip overview panel | 14 days / 68 stops / 8 cities / 93h est. time | ✅ Data-rich, scannable |
| Multiple views | Daily, Calendar, Timeline | ✅ Flexible, power-user ready |
| Stop type badges | sight, food, activity, nightlife, transport | ✅ Good taxonomy |

---

## 2. Brand Audit — Critical Gaps

| Gap | Issue |
|---|---|
| **No brand name** | "Travel Planner" is purely generic |
| **Weak logo** | Orange circle + map pin — unrecognizable at small sizes |
| **Body font is system-ui** | Default stack feels unresolved against the premium serif |
| **Badge color system missing** | All stop-type badges look identical — type doesn't code visually |
| **Teal accent underused** | `#1f5f61` only used for focus rings, it's a beautiful accent color |
| **Hero gradient missing** | White text sits directly on photo — legibility is fragile |
| **Destructive "Delete" button** | Red alongside primary CTA is alarming — no visual hierarchy |
| **Number bubbles** | Dark circle with number is functional, not beautiful |
| **Calendar typography** | Inconsistent with the rest of the type scale |
| **Map tiles unstyled** | Default OSM tiles break the brand palette |
| **No brand voice** | Copy is neutral/functional — no owned tone |
| **Footer empty** | Just copyright — missed brand touch |
| **No motion principles** | No defined transitions / animation language |

---

## 3. Brand Soul

### The Idea
**"The Traveler's Journal, made intelligent."**

The app occupies the intersection of three archetypes:
- **The Explorer's Notebook** — personal, annotated, handcrafted
- **The Travel Magazine** — curated, beautiful, aspirational (Condé Nast Traveler, Monocle)
- **The Intelligent Companion** — AI-powered, organized, never loses a detail

The brand emotion: **the feeling of opening your passport to an unfilled page — anticipation, freedom, possibility.**

### Brand Personality
| Dimension | Expression |
|---|---|
| **Tone** | Warm · Intelligent · Unhurried |
| **Voice** | Curious local guide, not corporate travel agent |
| **Posture** | Confident but never loud |
| **Aesthetic** | Editorial meets explorer — Kinfolk × Monocle × National Geographic |
| **Feeling** | Golden hour. Worn leather. A café in a city you just arrived in. |

### Brand Positioning
> *Not another travel app. The place where your trip becomes real.*

---

## 4. Brand Name Recommendation

**Current:** "Travel Planner" (generic placeholder)

**Recommended:** **Roam**

- Short, ownable, international
- One syllable — works at any size in any language
- Verb + noun — "I'll Roam" / "my Roam" / "open Roam"
- Available aesthetic: wordmark in DM Serif Display with tracked caps `R O A M`

**Alternative:** **Wayfarer** — more editorial, longer, better for a premium/magazine-tier positioning.

**Second alternative:** **Itineris** — Latin root (*iter* = journey), sophisticated, distinct, B2B-friendly if needed.

---

## 5. Color System

### Light Mode — Complete Token Map

| Token | Hex | Role |
|---|---|---|
| `--background` | `#f7f3ee` | Page canvas — warm linen |
| `--foreground` | `#2c1f18` | Primary text — deep espresso |
| `--card` | `#ffffff` | Card surface |
| `--card-foreground` | `#2c1f18` | Card text |
| `--primary` | `#c65d3b` | Terracotta — main brand CTA color |
| `--primary-foreground` | `#ffffff` | Text on primary |
| `--secondary` | `#fbf8f4` | Near-white warm — secondary surfaces |
| `--muted` | `#fbf8f4` | Muted background |
| `--muted-foreground` | `#7a6f66` | Secondary text — warm medium grey-brown |
| `--accent` | `#f2e4df` | Blush — hover states, selected |
| `--border` | `#e7ded5` | Warm tan borders |
| `--ring` | `#1f5f61` | Deep teal — focus ring |
| `--destructive` | `#d64545` | Error red |

### Dark Mode — Complete Token Map

| Token | Hex | Role |
|---|---|---|
| `--background` | `#120b07` | Near-black warm — not cold |
| `--foreground` | `#faf6f1` | Warm white |
| `--card` | `#1a120e` | Espresso card surface |
| `--primary` | `#e07a57` | Coral terracotta (lighter for dark bg) |
| `--accent` | `#e07a5724` | Terracotta at 14% opacity |
| `--ring` | `#5aa6a8` | Light teal |
| `--border` | `#ffffff1a` | White at 10% opacity |

### Extended Palette (Additions)

The existing system is strong. Additions needed:

**Teal Family** (currently only used for focus ring — extend its role):
- `--teal-900`: `#1f5f61` (existing ring)
- `--teal-600`: `#2a8b8e`
- `--teal-400`: `#5aa6a8` (dark mode ring)
- `--teal-100`: `#d6eeef`

Use teal as: secondary action color, "confirmed/completed" states, map pin highlight.

**Stop-Type Badge Color System** (currently all look alike):
| Type | Light bg | Light text | Dark bg | Icon |
|---|---|---|---|---|
| `sight` | `#fdefd6` | `#92560a` | `#3a2a0a` | 🏛 |
| `food` | `#fde8e8` | `#8b2020` | `#3a0a0a` | 🍽 |
| `activity` | `#d6f0ee` | `#1a5f60` | `#0a2a2b` | 🎯 |
| `nightlife` | `#e8d6f5` | `#5a1f8b` | `#200a3a` | 🌙 |
| `transport` | `#d6e4f5` | `#1a3f6f` | `#0a1a2a` | ✈️ |
| `accommodation` | `#e8f5d6` | `#2a5f1a` | `#0a2a0a` | 🏨 |

### Color Palette — Named Scale

```
Linen    #f7f3ee   Background canvas
Parchment #fbf8f4  Secondary surface
Blush    #f2e4df   Accent / hover
Sand     #e7ded5   Border
Dusk     #7a6f66   Muted text
Espresso #2c1f18   Primary text
---
Terracotta #c65d3b  Primary brand (light)
Coral      #e07a57  Primary brand (dark)
---
Teal     #1f5f61   Secondary accent (light)
Seafoam  #5aa6a8   Secondary accent (dark)
---
Obsidian #120b07   Dark background
```

---

## 6. Typography System

### Type Scale

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| **Display** (hero H1) | DM Serif Display | 56–72px | 400 | 1.1 | −0.03em |
| **Title** (trip name H1) | DM Serif Display | 36–48px | 400 | 1.15 | −0.02em |
| **H2** (Day header) | DM Serif Display | 24px | 400 | 1.3 | −0.01em |
| **H3** (Stop name) | DM Sans | 15px | 600 | 1.4 | 0 |
| **Label** (Morning/Afternoon/Evening) | DM Sans | 11px | 700 | 1 | +0.08em uppercase |
| **Body** | DM Sans | 14px | 400 | 1.6 | 0 |
| **UI / Button** | DM Sans | 14px | 500 | 1 | 0 |
| **Caption / Meta** | DM Sans | 12px | 400 | 1.4 | 0 |
| **Micro** (badge type) | DM Sans | 11px | 500 | 1 | +0.04em |

### Font Pairing Rationale

**DM Serif Display** (headings) + **DM Sans** (body/UI)

- Same family → harmonious contrast without clashing
- DM Serif Display has Italian old-style references → warmth, editorial authority
- DM Sans is humanist, clear, friendly → readable at small sizes
- Currently the app uses DM Serif Display + system-ui (mismatched). **Switch body to DM Sans.**

Google Fonts import:
```
DM Serif Display: 400, 400i
DM Sans: 300, 400, 500, 600, 700
```

### Typography Usage Rules
1. **Serif only for editorial moments**: trip titles, day headers, hero tagline, section intros
2. **Never serif for UI chrome**: buttons, nav, badges, meta — always DM Sans
3. **Negative tracking on all serif** display sizes (−0.01em to −0.03em)
4. **Positive tracking on uppercase labels** (+0.06–0.10em)
5. **Maximum 3 type sizes per screen** — ruthless hierarchy

---

## 7. Logo & Mark

### Current
An orange circle containing a map pin. Generic.

### Recommended Mark

**Primary Wordmark:** "ROAM" set in DM Serif Display, lowercase italic, tracked at 0em.
- Compact, single word
- Feels like a magazine masthead

**Icon Mark:** A minimal compass rose reduced to 4 points, one of which extends longer (the direction of travel). Set in `--primary` terracotta.
- Works at 16×16px as favicon
- Works embossed on a card surface

**Logo Lock-up (nav):**
```
[compass mark]  roam
```
The mark occupies 28×28px, the wordmark is DM Serif Display italic 18px.

**Usage Rules:**
- Minimum clear space: 1× mark height on all sides
- On photos: white version only, never on busy image areas without a blur/scrim
- Never stretch, rotate, or recolor to anything outside the brand palette

---

## 8. Spacing & Layout System

### Spacing Scale (4px base unit)
```
2px   — hairline gap (icon-to-label within badge)
4px   — xs
8px   — sm  (intra-component)
12px  — md-sm
16px  — md  (standard component padding)
20px  — md-lg
24px  — lg  (card padding, section gap)
32px  — xl  (major section padding)
40px  — 2xl
48px  — 3xl
64px  — 4xl (hero vertical padding)
```

### Layout Structure
- **Nav height:** 56px (sticky)
- **Max content width:** 1200px, centered
- **Trip detail layout:** Left panel 60% / Right panel 40% (map + overview) on ≥1024px
- **Card border radius:** 14px (existing — keep)
- **Button border radius:** 14px (existing — keep, matches card → system coherence)
- **Input border radius:** 10px (slightly tighter than buttons)
- **Badge border radius:** 6px (pill-adjacent but not full pill → more refined)

---

## 9. Component Language

### Buttons

**Primary (CTA):**
- Background: `--primary` (#c65d3b)
- Text: white, DM Sans 14px 500
- Padding: 10px 20px
- Radius: 14px
- Hover: darken 8% → `#b0502f`
- Active: darken 14%
- Icon: 16px, always left of label, 6px gap

**Secondary (ghost):**
- Background: transparent
- Border: 1.5px `--border`
- Text: `--foreground`
- Hover: background `--accent`

**Tertiary (text link):**
- No background, no border
- Text: `--primary` with underline on hover only

**Destructive:**
- NOT red primary button — use ghost treatment with red text + red border only
- Confirm with a two-step modal before executing delete

**Floating Action:**
- "New Trip" in nav: primary filled, with `+` icon prefix

### Stop Cards

Current stop cards are functional. Elevation:
1. Stop image: 64×64px, radius 8px (tighter than card for visual layering)
2. Number bubble: Replace dark circle with a terracotta pill `#c65d3b`, white number, 20×20px, radius 10px
3. Type badge: Apply the color-coded badge system from §5
4. Action buttons (Note/Swap/Map): move to a hover-revealed tray — reduce visual noise at rest
5. Duration meta: Use a clock icon + "60 min" in `--muted-foreground`

### Day Selector Pills (horizontal scroller)

Current: active day shows filled terracotta, others muted. Good.
Additions:
- Add a subtle count indicator below the day location name (small dot for each stop)
- On mobile: 56px × 80px pill with horizontal scroll snap

### Hero Section (trip detail)

**Current issue:** Text directly on photo — fragile legibility.

**Solution:** Add a gradient scrim:
```css
background: linear-gradient(
  to top,
  rgba(18, 11, 7, 0.85) 0%,   /* bottom — text area */
  rgba(18, 11, 7, 0.20) 60%,   /* middle */
  rgba(18, 11, 7, 0) 100%      /* top */
);
```
- Applied as a pseudo-element over the hero image
- Text (title + metadata pills) sits in the bottom third
- Breadcrumb sits at top left, padding-top matches nav height

### Metadata Pills (in hero)

Current: `Mar 13 – Mar 26` and `14 days · 68 stops` in pill badges.
Update: Semi-transparent dark background (`rgba(18,11,7,0.5)`) with 1px white/10% border. Backdrop-blur: 8px. This gives a glassmorphism treatment that reads "travel premium" — think Apple's Maps UI.

### Map

- Use a custom Stadia Maps / MapTiler tile style in warm neutral tones to match brand palette
- Pin markers: `--primary` terracotta filled circles with stop number inside
- Active/selected pin: larger, with a drop shadow
- The numbered pin colors should match their stop-type badge colors when in expanded mode

### Morning / Afternoon / Evening Headers

Current: icon + text label.
Update:
- Uppercase DM Sans, 11px, 600 weight, +0.08em tracking
- A subtle horizontal rule before the label
- Color-coded icon: sun (morning/amber), sun-horizon (afternoon/terracotta), moon (evening/deep teal)

---

## 10. Motion & Animation Principles

### Philosophy
**"Unhurried but alive."** Transitions acknowledge user action without demanding attention. The app should feel like a well-bound book, not a slot machine.

### Timings
| Use | Duration | Easing |
|---|---|---|
| Micro (hover, focus) | 120ms | ease-out |
| Component (expand, reveal) | 200ms | cubic-bezier(0.16, 1, 0.3, 1) — spring |
| Page/view transition | 300ms | ease-in-out |
| Skeleton loading | 1500ms loop | ease-in-out sine |

### Specific Interactions
- **Day selector click:** Selected pill slides + scale-in from current position (no jump)
- **Stop card expand (Read more):** Max-height transition, no layout shift
- **View switch (Daily → Calendar → Timeline):** Fade + subtle translate-Y 4px upward — feels like turning a page
- **Create trip loading:** Animated map-pin that pulses in `--primary`, bouncing like a heartbeat
- **Drag-to-reorder:** Card lifts with `box-shadow` elevation increase + slight rotation (±1.5°)

---

## 11. Voice & Copy System

### Tone Principles
1. **Curious, not corporate** — "Your afternoon in Hội An" not "Itinerary item #3"
2. **Evocative, not verbose** — one vivid detail beats three generic ones
3. **Confident, not bossy** — suggest, don't instruct
4. **Warm, not informal** — a knowledgeable friend, not a chatbot

### UI Copy Standards

| Context | Current | Recommended |
|---|---|---|
| Hero tagline | "Turn your notes into a trip you can see" | Keep — it's excellent copy |
| Hero sub | "Paste your itinerary and we add..." | Keep — clear value prop |
| Empty state (no trips) | (not seen) | "Your next adventure starts here. Drop in your itinerary above →" |
| CTA | "Create trip" | "Build my trip" or keep "Create trip" (both fine) |
| "Try an example" | link text | "See a sample trip →" (more inviting) |
| Delete confirm | (unknown) | "Delete this trip? This can't be undone." + ghost red button |
| Footer | "Geocoding © OpenStreetMap..." | Add: "Made for explorers. © 2025 Roam." |

### Day Summary Voice
The AI-generated day intros (e.g., "Your day in Ho Chi Minh City begins at the bustling Bến Thành Market...") are already strong. They should:
- Always open with the traveler as protagonist
- Include one sensory detail (smell, sound, texture)
- End with an anticipation beat (what's next / how the day closes)

---

## 12. Dark Mode Design Principles

The current dark mode is directionally correct (warm dark, not cold blue-grey). Refinements:

1. **Surface elevation** should still be readable in dark mode:
   - Background: `#120b07`
   - Card: `#1a120e` (+1 stop lighter)
   - Modal/popover: `#221812` (+2 stops)
   - This "dark surface layering" creates depth without light colors

2. **Never use pure white** text in dark mode — use `#faf6f1` (warm white). ✅ Already correct.

3. **Primary color shift:** Terracotta lightens from `#c65d3b` to `#e07a57` in dark mode. ✅ Already correct. Ensure hover state goes to `#d4694a` (midpoint).

4. **Glassmorphism in dark mode:** Hero scrim and metadata pills work even better in dark mode — the blur effect on `rgba(18,11,7,0.6)` is dramatic and beautiful.

5. **Map in dark mode:** Switch to a dark-optimized tile style (Stadia Alidade Smooth Dark or similar) — this is critical, the light OSM tiles in dark mode look jarring.

---

## 13. UX Architecture Improvements

### Priority 1 — Quick Wins
- [ ] Switch body font from system-ui to DM Sans
- [ ] Add gradient scrim to trip hero section
- [ ] Color-code stop-type badges (the taxonomy table from §5)
- [ ] Replace black number bubble with terracotta pill
- [ ] Destructive button: ghost red style + 2-step confirm

### Priority 2 — Polish
- [ ] Styled map tiles (Stadia or MapTiler warm neutral)
- [ ] Glassmorphism treatment for hero metadata pills
- [ ] Hover-revealed action tray on stop cards (reduce visual noise)
- [ ] Morning/Afternoon/Evening headers with color-coded icons
- [ ] Footer with brand voice ("Made for explorers")

### Priority 3 — Identity
- [ ] Brand rename (Roam or Wayfarer)
- [ ] New logo mark (compass rose variant)
- [ ] Full wordmark system

### Priority 4 — Motion
- [ ] View switch transitions (Daily/Calendar/Timeline)
- [ ] Stop card expand animation
- [ ] Create trip loading state animation

---

## 14. Brand Reference Inspirations

| Brand | What to borrow |
|---|---|
| **Monocle** | Editorial serif confidence, warm photography, unhurried white space |
| **Kinfolk Magazine** | Texture, warmth, the feeling of holding something physical |
| **Airbnb (early 2014)** | Warmth in UX, the "belong anywhere" emotional resonance |
| **Apple Maps** | Glassmorphism pill components, map marker system |
| **Notion** | Clean information hierarchy, the card-as-document metaphor |
| **Google Maps (trip planning)** | Stop categorization taxonomy |

---

## 15. Implementation Action

**Output file:** `/Users/alexbuchel/design.md`

Copy this document verbatim as `design.md` in the working directory. The file serves as the standalone brand & design language reference for the app.

---

## 16. Verification / Implementation Checklist

When implementing, validate against:
1. Open app in both light and dark mode — every screen should feel cohesive
2. Check all 6 stop-type badge colors against WCAG AA contrast (4.5:1 minimum)
3. DM Sans loads before DM Serif Display on slow connections — test font loading order
4. Hero gradient scrim must not obscure the top 30% of the hero photo (the sky/landmark)
5. Number bubbles must be legible at 2-digit numbers (e.g., stop "12")
6. All button hover states must be visually distinct from resting state at 100% zoom
7. Timeline view left connector line must align with the center of each day's dot marker
8. Calendar date cells with trips must be clearly distinguishable from empty dates
9. Map marker colors must match their corresponding stop-type badge colors
10. Mobile (375px wide): day selector pills scroll horizontally without clipping, cards stack properly
